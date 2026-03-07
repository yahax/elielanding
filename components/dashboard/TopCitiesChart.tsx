'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    CartesianGrid,
} from 'recharts';

const COLORS = ['#c9a84c', '#a8863c', '#8b6e32', '#6e5628', '#513f1f'];

interface Props {
    data: { city: string; count: number }[];
}

export function TopCitiesChart({ data }: Props) {
    return (
        <div className="card" style={{ height: 280 }}>
            <div className="card-title">Top Villes</div>
            {data.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
                    Aucune donnée
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fill: '#8a8a9a', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="city"
                            tick={{ fill: '#f0f0f5', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={72}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#1e1e2a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(v: number | undefined) => [`${v ?? 0} commande${(v ?? 0) > 1 ? 's' : ''}`, '']}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
