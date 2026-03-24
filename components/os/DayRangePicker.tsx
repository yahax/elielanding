'use client';

import { RefreshCw } from 'lucide-react';

interface DayRangePickerProps {
    value: 7 | 30;
    onChange: (days: 7 | 30) => void;
    loading?: boolean;
    onRefresh?: () => void;
}

export function DayRangePicker({ value, onChange, loading = false, onRefresh }: DayRangePickerProps) {
    return (
        <div className="day-range-picker">
            <div className="day-range-tabs">
                {([7, 30] as const).map((d) => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => onChange(d)}
                        className={`btn btn-xs${value === d ? ' btn-primary' : ''}`}
                    >
                        {d} j
                    </button>
                ))}
            </div>
            {onRefresh && (
                <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={onRefresh}
                    aria-label="Actualiser"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            )}
        </div>
    );
}
