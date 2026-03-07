import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/server';
import { fetchCatalogProducts } from '@/lib/os/server';

export async function GET() {
  try {
    const products = await fetchCatalogProducts();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch catalog', products: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServiceSupabaseClient();

    // 1. Create perfume record
    const { data: perfume, error: pError } = await supabase
      .from('perfumes')
      .insert({
        name: body.name,
        gender: body.category || 'mixte',
        tier: body.tier || 'classic',
        is_active: body.is_active ?? true
      })
      .select()
      .single();

    if (pError) throw pError;

    // 2. Create inventory record
    const { error: iError } = await supabase
      .from('inventory')
      .insert({
        perfume_id: perfume.id,
        stock: body.stock || 0,
        low_stock_threshold: body.low_stock_threshold || 5
      });

    if (iError) console.error('[Catalog/API] Inventory creation failed:', iError);

    return NextResponse.json({ success: true, product: perfume });
  } catch (error: any) {
    console.error('[Catalog/API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const supabase = createServiceSupabaseClient();

    // Separate updates for perfumes and inventory
    const perfumeUpdates: any = {};
    if (updates.name) perfumeUpdates.name = updates.name;
    if (updates.category) perfumeUpdates.gender = updates.category;
    if (updates.tier) perfumeUpdates.tier = updates.tier;
    if (updates.is_active !== undefined) perfumeUpdates.is_active = updates.is_active;

    if (Object.keys(perfumeUpdates).length > 0) {
      const { error: pError } = await supabase
        .from('perfumes')
        .update(perfumeUpdates)
        .eq('id', id);
      if (pError) throw pError;
    }

    const inventoryUpdates: any = {};
    if (updates.stock !== undefined) inventoryUpdates.stock = updates.stock;
    if (updates.low_stock_threshold !== undefined) inventoryUpdates.low_stock_threshold = updates.low_stock_threshold;

    if (Object.keys(inventoryUpdates).length > 0) {
      const { error: iError } = await supabase
        .from('inventory')
        .upsert({
          perfume_id: id,
          ...inventoryUpdates,
          updated_at: new Date().toISOString()
        });
      if (iError) throw iError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Catalog/API] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
