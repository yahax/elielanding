import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchCatalogProducts } from "@/lib/os/server";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { logAuditEntry } from "@/lib/os/audit/logger";
import { dispatchDomainEvent } from "@/lib/os/realtime/event-dispatcher";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";

const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1).optional(),
  tier: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).max(1000).optional(),
});

const updateProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    tier: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    stock: z.number().int().min(0).optional(),
    low_stock_threshold: z.number().int().min(0).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    const updateKeys = Object.keys(value).filter((key) => key !== "id");
    if (updateKeys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field to update is required.",
      });
    }
  });

interface PerfumeRecord {
  id: string;
  name: string;
  gender: string | null;
  tier: string | null;
  is_active: boolean | null;
}

interface InventorySnapshot {
  stock: number;
  lowStockThreshold: number;
}

interface InventoryRecord {
  stock: number | null;
  low_stock_threshold: number | null;
}

function isMissingTableError(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "PGRST204" || code === "PGRST205" || code === "42P01";
}

function readInventorySnapshot(raw: InventoryRecord | null): InventorySnapshot {
  const candidate = raw ?? { stock: 0, low_stock_threshold: 5 };
  return {
    stock: Number.isFinite(Number(candidate.stock ?? 0)) ? Number(candidate.stock ?? 0) : 0,
    lowStockThreshold: Number.isFinite(Number(candidate.low_stock_threshold ?? 5))
      ? Number(candidate.low_stock_threshold ?? 5)
      : 5,
  };
}

async function findCatalogProductById(productId: string) {
  const products = await fetchCatalogProducts();
  return products.find((product) => product.id === productId) ?? null;
}

export async function GET() {
  try {
    const products = await fetchCatalogProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.warn("[API/OS] catalog fallback empty products:", error);
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await resolveActorFromRequest(req);
    const body = createProductSchema.parse(await req.json());
    const supabase = createServiceSupabaseClient();
    const productId = randomUUID();

    const { data: perfume, error: perfumeError } = await supabase
      .from("perfumes")
      .insert({
        id: productId,
        name: body.name.trim(),
        gender: body.category?.trim() || "mixte",
        tier: body.tier?.trim() || "classic",
        is_active: body.is_active ?? true,
      })
      .select("id,name,gender,tier,is_active")
      .single();

    if (perfumeError || !perfume) {
      throw perfumeError ?? new Error("Unable to create product");
    }

    const initialStock = body.stock ?? 0;
    const initialThreshold = body.low_stock_threshold ?? 5;

    const { error: inventoryError } = await supabase.from("inventory").upsert(
      {
        perfume_id: perfume.id,
        stock: initialStock,
        low_stock_threshold: initialThreshold,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "perfume_id" }
    );

    if (inventoryError && !isMissingTableError(inventoryError)) {
      throw inventoryError;
    }

    await logAuditEntry({
      actorId: actor.actorId,
      actorName: actor.actorName,
      actionType: "catalog.product_created",
      entityType: "stock",
      entityId: perfume.id,
      label: "Produit créé",
      details: `${perfume.name} créé avec stock initial ${initialStock}.`,
      metadata: {
        productName: perfume.name,
        category: perfume.gender,
        tier: perfume.tier,
        stock: initialStock,
        lowStockThreshold: initialThreshold,
      },
    });

    await dispatchDomainEvent({
      type: "stock.updated",
      entityType: "stock",
      entityId: perfume.id,
      actorId: actor.actorId,
      actorName: actor.actorName,
      label: `Stock initial enregistré pour ${perfume.name}`,
      payload: {
        productName: perfume.name,
        stock: initialStock,
        lowStockThreshold: initialThreshold,
        delta: initialStock,
        isCritical: initialStock <= initialThreshold,
      },
    });

    if (initialStock <= initialThreshold) {
      await dispatchDomainEvent({
        type: "notification.created",
        entityType: "notification",
        entityId: `stock:${perfume.id}`,
        actorId: actor.actorId,
        actorName: actor.actorName,
        label: `Stock critique détecté: ${perfume.name}`,
        payload: {
          productId: perfume.id,
          productName: perfume.name,
          stock: initialStock,
          lowStockThreshold: initialThreshold,
          link: "/os-admin/inventory",
        },
      });
    }

    const product = await findCatalogProductById(perfume.id);
    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to create catalog product");
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await resolveActorFromRequest(req);
    const body = updateProductSchema.parse(await req.json());
    const { id, ...updates } = body;
    const supabase = createServiceSupabaseClient();
    return executeIdempotentJsonMutation({
      req,
      scope: "catalog.patch",
      actorId: actor.actorId,
      payload: body,
      execute: async () => {
        const { data: existing, error: existingError } = await supabase
          .from("perfumes")
          .select("id,name,gender,tier,is_active")
          .eq("id", id)
          .maybeSingle();

        if (existingError) throw existingError;
        if (!existing) {
          return { status: 404, body: { error: "Product not found" } };
        }

        const currentProduct = existing as PerfumeRecord;
        const { data: currentInventoryRow, error: currentInventoryError } = await supabase
          .from("inventory")
          .select("stock,low_stock_threshold")
          .eq("perfume_id", id)
          .maybeSingle();
        if (currentInventoryError && !isMissingTableError(currentInventoryError)) {
          throw currentInventoryError;
        }
        const currentInventory = readInventorySnapshot((currentInventoryRow ?? null) as InventoryRecord | null);
        const perfumeUpdates: Record<string, unknown> = {};

        if (typeof updates.name === "string" && updates.name.trim() !== currentProduct.name) {
          perfumeUpdates.name = updates.name.trim();
        }
        if (typeof updates.category === "string" && updates.category.trim() !== (currentProduct.gender ?? "")) {
          perfumeUpdates.gender = updates.category.trim();
        }
        if (typeof updates.tier === "string" && updates.tier.trim() !== (currentProduct.tier ?? "")) {
          perfumeUpdates.tier = updates.tier.trim();
        }
        if (typeof updates.is_active === "boolean" && updates.is_active !== currentProduct.is_active) {
          perfumeUpdates.is_active = updates.is_active;
        }

        if (Object.keys(perfumeUpdates).length > 0) {
          const { error: perfumeError } = await supabase
            .from("perfumes")
            .update(perfumeUpdates)
            .eq("id", id);

          if (perfumeError) throw perfumeError;
        }

        const inventoryUpdates: Record<string, unknown> = {};
        if (typeof updates.stock === "number" && updates.stock !== currentInventory.stock) {
          inventoryUpdates.stock = updates.stock;
        }
        if (
          typeof updates.low_stock_threshold === "number" &&
          updates.low_stock_threshold !== currentInventory.lowStockThreshold
        ) {
          inventoryUpdates.low_stock_threshold = updates.low_stock_threshold;
        }

        if (Object.keys(inventoryUpdates).length > 0) {
          const { error: inventoryError } = await supabase.from("inventory").upsert(
            {
              perfume_id: id,
              ...inventoryUpdates,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "perfume_id" }
          );

          if (inventoryError && !isMissingTableError(inventoryError)) {
            throw inventoryError;
          }
        }

        const product = await findCatalogProductById(id);
        const productName = product?.name ?? currentProduct.name ?? "Produit";
        const nextStock = product?.stock ?? (typeof updates.stock === "number" ? updates.stock : currentInventory.stock);
        const nextThreshold =
          product?.low_stock_threshold ??
          (typeof updates.low_stock_threshold === "number" ? updates.low_stock_threshold : currentInventory.lowStockThreshold);
        const stockChanged = nextStock !== currentInventory.stock || nextThreshold !== currentInventory.lowStockThreshold;

        if (stockChanged) {
          const delta = nextStock - currentInventory.stock;

          await logAuditEntry({
            actorId: actor.actorId,
            actorName: actor.actorName,
            actionType: "stock.adjusted",
            entityType: "stock",
            entityId: id,
            label: "Stock ajusté",
            details: `${productName}: ${currentInventory.stock} -> ${nextStock} (seuil ${currentInventory.lowStockThreshold} -> ${nextThreshold}).`,
            metadata: {
              productName,
              beforeStock: currentInventory.stock,
              afterStock: nextStock,
              beforeThreshold: currentInventory.lowStockThreshold,
              afterThreshold: nextThreshold,
              delta,
            },
          });

          try {
            const { error: moveError } = await supabase.from("os_inventory_adjustments").insert({
              id: randomUUID(),
              perfume_id: id,
              product_name: productName,
              delta,
              previous_stock: currentInventory.stock,
              next_stock: nextStock,
              actor_id: actor.actorId,
              actor_name: actor.actorName,
              reason: "manual_adjustment",
              metadata: {
                beforeThreshold: currentInventory.lowStockThreshold,
                afterThreshold: nextThreshold,
              },
              created_at: new Date().toISOString(),
            });
            if (moveError && !isMissingTableError(moveError)) {
              throw moveError;
            }
          } catch (moveError) {
            console.warn("[CATALOG] inventory adjustment history fallback:", moveError);
          }

          await dispatchDomainEvent({
            type: "stock.updated",
            entityType: "stock",
            entityId: id,
            actorId: actor.actorId,
            actorName: actor.actorName,
            label: `Stock mis à jour: ${productName}`,
            payload: {
              productName,
              beforeStock: currentInventory.stock,
              afterStock: nextStock,
              beforeThreshold: currentInventory.lowStockThreshold,
              afterThreshold: nextThreshold,
              delta,
              isCritical: nextStock <= nextThreshold,
            },
          });

          if (nextStock <= nextThreshold) {
            await dispatchDomainEvent({
              type: "notification.created",
              entityType: "notification",
              entityId: `stock:${id}:${Date.now()}`,
              actorId: actor.actorId,
              actorName: actor.actorName,
              label: `Alerte stock critique: ${productName}`,
              payload: {
                productId: id,
                productName,
                stock: nextStock,
                lowStockThreshold: nextThreshold,
                link: "/os-admin/inventory",
              },
            });
          }
        } else if (Object.keys(perfumeUpdates).length > 0) {
          await logAuditEntry({
            actorId: actor.actorId,
            actorName: actor.actorName,
            actionType: "catalog.product_updated",
            entityType: "stock",
            entityId: id,
            label: "Produit mis à jour",
            details: `${productName} mis à jour (hors stock).`,
            metadata: {
              updatedFields: Object.keys(perfumeUpdates),
            },
          });
        }

        return {
          body: {
            success: true,
            unchanged: Object.keys(perfumeUpdates).length === 0 && Object.keys(inventoryUpdates).length === 0,
            product,
          },
        };
      },
      onError: (error) => mapApiError(error, "Unable to update catalog product"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to update catalog product");
  }
}
