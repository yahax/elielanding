'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_LIST } from '@/lib/types';
import { PipelineColumn } from '@/components/dashboard/PipelineColumn';
import { OrderCard } from '@/components/dashboard/OrderCard';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import toast, { Toaster } from 'react-hot-toast';
import { OrderDetailDrawer } from '@/components/dashboard/OrderDetailDrawer';

export default function PipelinePage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            console.log('[Pipeline] Executing query: .from("orders").select("*").not("status", "eq", "delivered").not("status", "eq", "canceled").order("created_at", { ascending: false })');

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .not('status', 'eq', 'delivered')
                .not('status', 'eq', 'canceled')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Pipeline] Supabase return error:', error);
                throw error;
            }

            const fetchedOrders = (data || []) as Order[];
            console.log(`[Pipeline] Received ${fetchedOrders.length} orders`);
            setOrders(fetchedOrders);

            // Sync selected order if open
            if (selectedOrder) {
                const refreshed = fetchedOrders.find(o => o.id === selectedOrder.id);
                if (refreshed) setSelectedOrder(refreshed);
            }
        } catch (err: any) {
            console.error('[Pipeline] Global load error:', err);
            toast.error(err.message || 'Erreur Pipeline');
        } finally {
            setLoading(false);
        }
    }, [selectedOrder]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    // Live Sync V2.2
    useRealtimeOrders(loadOrders);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) {
            setActiveId(null);
            return;
        }

        const activeOrder = orders.find(o => o.id === active.id);
        const overId = over.id as string;

        // If dropped over a column (column ids are the statuses)
        if (STATUS_LIST.includes(overId as any) && activeOrder && activeOrder.status !== overId) {
            await updateOrderStatus(activeOrder.id, overId as OrderStatus);
        }

        setActiveId(null);
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const supabase = createClient();
            console.log(`[Pipeline] Updating order ${orderId} to ${newStatus}`);

            const { error } = await supabase.rpc('update_order_status_secure', {
                p_order_id: orderId,
                p_new_status: newStatus
            });

            if (error) {
                console.error('[Pipeline] Update RPC error:', error);
                throw error;
            }

            toast.success(`Statut: ${STATUS_LABELS[newStatus]}`);
            // Robust refresh
            await loadOrders();
        } catch (err: any) {
            console.error('[Pipeline] Update error:', err);
            toast.error(err.message || 'Erreur mise à jour');
            loadOrders();
        }
    };

    const openOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDrawerOpen(true);
    };

    const columns = STATUS_LIST.filter(s => s !== 'delivered' && s !== 'canceled');

    if (loading && orders.length === 0) return (
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span style={{ marginLeft: 12, fontWeight: 700 }}>Chargement du Pipeline…</span>
        </div>
    );

    return (
        <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Toaster position="top-right" />
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h2 className="page-title">Pipeline de Vente V2</h2>
                    <p className="page-subtitle">Suivez vos flux opérationnels en temps réel</p>
                </div>
            </div>

            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                gap: 20,
                minHeight: 0,
                paddingBottom: 20,
                overflowX: 'auto'
            }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {columns.map(status => (
                        <PipelineColumn
                            key={status}
                            id={status}
                            title={STATUS_LABELS[status]}
                            count={orders.filter(o => o.status === status).length}
                        >
                            <SortableContext
                                items={orders.filter(o => o.status === status).map(o => o.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 100 }}>
                                    {orders.filter(o => o.status === status).map(order => (
                                        <OrderCard key={order.id} order={order} onClick={openOrderDetails} />
                                    ))}
                                    {orders.filter(o => o.status === status).length === 0 && (
                                        <div style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 16, opacity: 0.4, fontSize: 11, fontWeight: 700 }}>
                                            VIDE
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </PipelineColumn>
                    ))}

                    <DragOverlay>
                        {activeId ? (
                            <OrderCard order={orders.find(o => o.id === activeId)!} isOverlay />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <OrderDetailDrawer
                order={selectedOrder}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpdateStatus={updateOrderStatus}
            />
        </div>
    );
}

