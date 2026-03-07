'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface PipelineColumnProps {
    id: string;
    title: string;
    count: number;
    children: React.ReactNode;
}

export function PipelineColumn({ id, title, count, children }: PipelineColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{
                background: isOver ? 'var(--surface-2)' : '#F5F5F7',
                borderRadius: 20,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100%',
                transition: 'all 0.2s',
                border: isOver ? '2.5px dashed var(--gold)' : '1px solid transparent'
            }}
        >
            <div style={{
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <h3 style={{
                    fontSize: 12,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)'
                }}>
                    {title}
                </h3>
                <span style={{
                    background: '#FFF',
                    color: 'var(--text)',
                    fontWeight: 900,
                    padding: '2px 10px',
                    borderRadius: 10,
                    fontSize: 11,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    {count}
                </span>
            </div>

            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}
