import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export function useRealtimeOrders(onUpdate: () => void) {
    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload: any) => {
                    console.log('[Realtime] Order change:', payload.eventType, payload.new?.id || payload.old?.id);
                    onUpdate();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('[Realtime] Live sync active');
                if (status === 'CHANNEL_ERROR') console.error('[Realtime] Connection error');
            });

        return () => {
            console.log('[Realtime] Cleaning up...');
            supabase.removeChannel(channel);
        };
    }, [onUpdate]);
}
