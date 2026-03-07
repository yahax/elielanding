'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

interface Props {
    data: { hour: string; count: number }[];
}

export function OrdersPerHourChart({ data }: Props) {
    return (
        <div className="card" style={{ height: 280 }}>
            <div className="card-title">Commandes par heure</div>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="hour"
                        tick={{ fill: '#8a8a9a', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#8a8a9a', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1e1e2a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        labelStyle={{ color: '#f0f0f5' }}
                        itemStyle={{ color: '#c9a84c' }}
                        formatter={(v: number | undefined) => [`${(v ?? 0)} commande${(v ?? 0) > 1 ? 's' : ''}`, '']}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#c9a84c"
                        strokeWidth={2}
                        fill="url(#goldGrad)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
