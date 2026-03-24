'use client';

import { EmptyState } from '@/components/ui/States';

interface RankingItem {
    label: string;
    value: number | string;
    suffix?: string;
}

interface RankingListProps {
    title: string;
    items?: RankingItem[];
    valueSuffix?: string;
    emptyMessage?: string;
    limit?: number;
}

export function RankingList({
    title,
    items,
    valueSuffix = '',
    emptyMessage = 'Données indisponibles',
    limit = 5,
}: RankingListProps) {
    const list = items?.slice(0, limit);

    return (
        <div className="luxury-card ranking-card">
            <h4 className="ranking-title">{title}</h4>
            <div className="ranking-list">
                {list && list.length > 0 ? (
                    list.map((item, i) => (
                        <div
                            key={String(item.label)}
                            className={`ranking-row${i < list.length - 1 ? ' ranking-row-divider' : ''}`}
                        >
                            <span className="ranking-label">{item.label}</span>
                            <span className="ranking-value">
                                {item.value}
                                {item.suffix ?? valueSuffix}
                            </span>
                        </div>
                    ))
                ) : (
                    <EmptyState title="" copy={emptyMessage} />
                )}
            </div>
        </div>
    );
}
