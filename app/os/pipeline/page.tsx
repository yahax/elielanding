'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
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
import type { Order, OrderStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_LIST } from '@/lib/types';
import { PipelineColumn } from '@/components/os/PipelineColumn';
import { OrderCard } from '@/components/os/OrderCard';
import { fetchOrders, updateOrderStatus as updateOrderStatusRequest } from '@/lib/os/api';
import toast from 'react-hot-toast';
import { OrderDetailDrawer } from '@/components/os/OrderDetailDrawer';
import { OsToaster } from '@/components/ui/OsToaster';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/States';

export default function PipelinePage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const { orders: fetchedOrders } = await fetchOrders({ pipeline: true, limit: 800 });
            setOrders(fetchedOrders);

            setSelectedOrder(prev => {
                if (!prev) return prev;
                const refreshed = fetchedOrders.find((order) => order.id === prev.id);
                return refreshed || prev;
            });
        } catch (err: unknown) {
            console.error('[Pipeline] Global load error:', err);
            const message = err instanceof Error ? err.message : 'Erreur Pipeline';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

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
        const isStatusDropTarget = STATUS_LIST.includes(overId as OrderStatus);

        // If dropped over a column (column ids are the statuses)
        if (isStatusDropTarget && activeOrder && activeOrder.status !== overId) {
            await updateOrderStatus(activeOrder.id, overId as OrderStatus);
        }

        setActiveId(null);
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatusRequest(orderId, newStatus);

            toast.success(`Statut: ${STATUS_LABELS[newStatus]}`);
            // Robust refresh
            await loadOrders();
        } catch (err: unknown) {
            console.error('[Pipeline] Update error:', err);
            const message = err instanceof Error ? err.message : 'Erreur mise à jour';
            toast.error(message);
            loadOrders();
        }
    };

    const openOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDrawerOpen(true);
    };

    const columns: OrderStatus[] = ['new', 'callback', 'to_confirm', 'confirmed', 'shipped'];

    // Group orders by status for easier rendering
    const ordersByStatus = columns.reduce((acc, status) => {
        acc[status] = orders.filter(o => o.status === status);
        return acc;
    }, {} as Record<OrderStatus, Order[]>);

    if (loading && orders.length === 0) return <LoadingState label="Chargement du Pipeline…" />;

    return (
        <div className="os-page animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: 0 }}>
            <OsToaster />
            <PageHeader
                title="Pipeline Opérationnel"
                subtitle="Pilotage haute fidélité des flux de confirmation et logistique"
                actions={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{
                            padding: '8px 20px',
                            borderRadius: 14,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: '0.1em',
                            color: 'var(--text-dim)'
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                            FLUX RÉEL
                        </div>
                        <button className="btn-ghost" onClick={() => loadOrders()} style={{ width: 44, height: 44, padding: 0, borderRadius: 14, background: 'var(--surface)' }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                }
            />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div style={{
                    display: 'flex',
                    gap: 24,
                    flex: 1,
                    overflowX: 'auto',
                    paddingBottom: 24,
                    paddingRight: 10,
                    scrollBehavior: 'smooth'
                }}>
                    {columns.map((columnId) => (
                        <div
                            key={columnId}
                            style={{
                                minWidth: 340,
                                width: 340,
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'var(--bg-elevated)',
                                borderRadius: 28,
                                border: '1px solid var(--border)',
                                padding: '12px'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '18px 20px',
                                marginBottom: 14,
                                background: 'var(--surface)',
                                borderRadius: 20,
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: columnId === 'new' ? 'var(--gold)' :
                                            columnId === 'to_confirm' ? 'var(--warning)' :
                                                columnId === 'confirmed' ? 'var(--success)' :
                                                    columnId === 'shipped' ? 'var(--info)' :
                                                        columnId === 'callback' ? 'var(--info)' : 'var(--text-dim)',
                                        boxShadow: `0 0 10px ${columnId === 'new' ? 'rgba(201, 168, 106, 0.3)' : 'transparent'}`
                                    }} />
                                    <h3 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: 'var(--text)' }}>
                                        {STATUS_LABELS[columnId]}
                                    </h3>
                                </div>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 900,
                                    color: 'var(--gold)',
                                    background: 'var(--gold-glow)',
                                    padding: '4px 12px',
                                    borderRadius: 10,
                                    border: '1px solid var(--gold-border)'
                                }}>
                                    {ordersByStatus[columnId]?.length || 0}
                                </span>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }} className="custom-scrollbar">
                                <SortableContext items={(ordersByStatus[columnId] || []).map(o => o.id)} strategy={verticalListSortingStrategy}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {(ordersByStatus[columnId] || []).map((order) => (
                                            <OrderCard key={order.id} order={order} onClick={openOrderDetails} />
                                        ))}
                                        {(!ordersByStatus[columnId] || ordersByStatus[columnId].length === 0) && (
                                            <div style={{
                                                padding: '48px 20px',
                                                textAlign: 'center',
                                                border: '2px dashed var(--border)',
                                                borderRadius: 22,
                                                opacity: 0.4,
                                                background: 'rgba(0,0,0,0.01)'
                                            }}>
                                                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>AUCUN FLUX</div>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </div>
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <OrderCard
                            order={orders.find(o => o.id === activeId)!}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <OrderDetailDrawer
                order={selectedOrder}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpdateStatus={updateOrderStatus}
            />
        </div>
    );
}
