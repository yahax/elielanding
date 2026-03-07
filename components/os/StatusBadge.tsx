'use client';

const STATUS_LABELS: Record<string, string> = {
    new: 'Nouveau',
    to_confirm: 'À confirmer',
    confirmed: 'Confirmé',
    shipped: 'Expédié',
    delivered: 'Livré',
    canceled: 'Annulé',
    callback: 'À rappeler',
};

export function StatusBadge({ status }: { status: string }) {
    const label = STATUS_LABELS[status] || status;
    return (
        <span
            className={`badge badge-${status}`}
            title={label}
            style={{
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
            }}
        >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 6, opacity: 0.8 }} />
            {label}
        </span>
    );
}
