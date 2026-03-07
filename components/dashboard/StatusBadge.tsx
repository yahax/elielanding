'use client';

const STATUS_LABELS: Record<string, string> = {
    new: 'Nouveau',
    to_confirm: 'À confirmer',
    confirmed: 'Confirmé',
    shipped: 'Expédié',
    delivered: 'Livré',
    canceled: 'Annulé',
};

export function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`badge badge-${status}`}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {STATUS_LABELS[status] || status}
        </span>
    );
}
