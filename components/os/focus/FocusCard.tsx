"use client";

import Image from "next/image";
import { motion, type PanInfo } from "framer-motion";
import { BadgeCheck, Check, Clock3, MapPin, MessageCircle, PhoneCall, RotateCcw, X } from "lucide-react";
import type { FocusOrderMeta, WhatsAppTemplateId } from "@/store/useFocusQueue";
import type { NormalizedOrder } from "@/lib/os/types";
import { resolveProductImage } from "./product-media";
import styles from "./focus-os.module.css";

interface FocusCardProps {
  order: NormalizedOrder;
  queueLabel: string;
  loyalOrders: number;
  messageTemplate: WhatsAppTemplateId;
  messagePreview: string;
  meta?: FocusOrderMeta;
  pending?: boolean;
  isHistory?: boolean;
  onSelectTemplate: (template: WhatsAppTemplateId) => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onConfirm: () => void;
  onOpenCallback: () => void;
  onOpenCancel: () => void;
  onSwipeConfirm: () => void;
  onSwipeCancel: () => void;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  image: string;
}

const TEMPLATE_OPTIONS: Array<{ id: WhatsAppTemplateId; label: string }> = [
  { id: "confirmation", label: "Confirmation" },
  { id: "no_answer", label: "No answer" },
  { id: "callback", label: "Callback" },
  { id: "reminder", label: "Reminder" },
];

function buildOrderItems(order: NormalizedOrder): OrderItem[] {
  const selected = Array.isArray(order.selected_perfumes) ? order.selected_perfumes : [];
  const gift = typeof order.gift_perfume === "string" ? order.gift_perfume.trim() : "";
  const pool = [...selected.map((item) => item.trim()).filter(Boolean), ...(gift ? [gift] : [])];

  const map = new Map<string, number>();
  for (const name of pool) {
    map.set(name, (map.get(name) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([name, quantity]) => ({
    id: name,
    name,
    quantity,
    image: resolveProductImage(name),
  }));
}

function formatTotal(total: number): string {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(Number.isFinite(total) ? total : 0);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRelative(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(delta) || delta < 0) return "maintenant";
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "maintenant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} j`;
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  return phone.replace(/\s+/g, " ").trim();
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

export function FocusCard({
  order,
  queueLabel,
  loyalOrders,
  messageTemplate,
  messagePreview,
  meta,
  pending = false,
  isHistory = false,
  onSelectTemplate,
  onCall,
  onWhatsApp,
  onConfirm,
  onOpenCallback,
  onOpenCancel,
  onSwipeConfirm,
  onSwipeCancel,
}: FocusCardProps) {
  const items = buildOrderItems(order);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const trustIsLoyal = loyalOrders > 1;
  const swipeEnabled = !isHistory && !pending;

  const onCardDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobileViewport() || !swipeEnabled) return;
    if (info.offset.x > 110) {
      onSwipeConfirm();
      return;
    }
    if (info.offset.x < -110) {
      onSwipeCancel();
    }
  };

  return (
    <motion.article
      className={styles.focusCard}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      drag={swipeEnabled ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.16}
      onDragEnd={onCardDragEnd}
      whileDrag={{ scale: 0.995 }}
      data-history={isHistory ? "true" : "false"}
    >
      <section className={styles.cardZoneClient}>
        <span className={styles.queuePill}>{queueLabel}</span>
        <h2 className={styles.clientName}>{order.customer_name || "Client inconnu"}</h2>
        <a className={styles.clientPhone} href={`tel:${order.phone || ""}`}>
          {formatPhone(order.phone)}
        </a>

        <div className={styles.cityBlock}>
          <MapPin size={14} />
          <span>{order.city || "Ville non definie"}</span>
        </div>

        <div className={styles.trustBadge} data-loyal={trustIsLoyal ? "true" : "false"}>
          <BadgeCheck size={13} />
          <span>{trustIsLoyal ? `Loyal (${loyalOrders} orders)` : "New"}</span>
        </div>

        <div className={styles.clientActions}>
          <motion.button type="button" whileTap={{ scale: 0.96 }} className={styles.clientActionBtn} onClick={onCall}>
            <PhoneCall size={15} />
            <span>CALL</span>
          </motion.button>

          <motion.button type="button" whileTap={{ scale: 0.96 }} className={styles.clientActionBtn} onClick={onWhatsApp}>
            <MessageCircle size={15} />
            <span>WHATSAPP</span>
          </motion.button>
        </div>

        <div className={styles.templateRow}>
          {TEMPLATE_OPTIONS.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles.templateChip}
              data-active={messageTemplate === template.id ? "true" : "false"}
              onClick={() => onSelectTemplate(template.id)}
            >
              {template.label}
            </button>
          ))}
        </div>

        <div className={styles.whatsMeta}>
          {meta?.messageSentAt ? <span>Message sent {formatTime(meta.messageSentAt)}</span> : <span>Template ready</span>}
        </div>
      </section>

      <section className={styles.cardZoneOrder}>
        <div className={styles.mediaStrip}>
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className={styles.mediaThumb}>
              <Image src={item.image} alt={item.name} width={88} height={88} />
            </div>
          ))}
          {items.length === 0 ? <div className={styles.mediaEmpty}>Aucun produit</div> : null}
        </div>

        <div className={styles.orderLines}>
          {items.map((item) => (
            <div key={item.id} className={styles.orderLine}>
              <span>{item.name}</span>
              <strong>x{item.quantity}</strong>
            </div>
          ))}
        </div>

        <div className={styles.totalBlock}>
          <span className={styles.totalLabel}>TOTAL PRICE</span>
          <p className={styles.totalValue}>{formatTotal(order.total_price)} MAD</p>
        </div>

        <div className={styles.orderMeta}>
          <span>#{order.id.slice(-6).toUpperCase()}</span>
          <span>{formatTime(order.created_at)}</span>
          <span>{formatRelative(order.created_at)} ago</span>
          <span>{order.source || "direct"}</span>
          <span>{totalQuantity} item(s)</span>
        </div>
      </section>

      <section className={styles.cardZoneActions}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={styles.actionButton}
          data-tone="success"
          onClick={onConfirm}
          disabled={pending || isHistory}
        >
          <Check size={20} />
          <span>CONFIRM</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={styles.actionButton}
          data-tone="warning"
          onClick={onOpenCallback}
          disabled={pending || isHistory}
        >
          <RotateCcw size={20} />
          <span>CALLBACK</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={styles.actionButton}
          data-tone="danger"
          onClick={onOpenCancel}
          disabled={pending || isHistory}
        >
          <X size={20} />
          <span>CANCEL</span>
        </motion.button>

        <div className={styles.shortcutHint}>
          <Clock3 size={14} />
          <span>C / R / A / SPACE</span>
        </div>
      </section>

      <footer className={styles.previewFooter}>
        <p>{messagePreview}</p>
      </footer>
    </motion.article>
  );
}
