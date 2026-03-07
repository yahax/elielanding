'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#c9a84c', '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

interface Props {
    data: { name: string; count: number }[];
}

export function TopPerfumesChart({ data }: Props) {
    return (
        <div className="card" style={{ height: 280 }}>
            <div className="card-title">Top Parfums</div>
            {data.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
                    Aucune donnée
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: '#1e1e2a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                fontSize: 11,
                            }}
                            formatter={(v: number | undefined) => [`${v ?? 0} fois`, '']}
                        />
                        <Legend
                            iconType="circle"
                            iconSize={6}
                            wrapperStyle={{ fontSize: 10, color: '#8a8a9a' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
