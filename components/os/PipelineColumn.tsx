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
                background: isOver ? 'var(--surface-1)' : 'var(--bg-elevated)',
                borderRadius: 24,
                padding: '24px 12px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100%',
                transition: 'all 0.3s ease',
                border: isOver ? '1px dashed var(--gold)' : '1px solid var(--border)',
                boxShadow: isOver ? 'var(--shadow-lg)' : 'none'
            }}
        >
            <div style={{
                padding: '0 16px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--gold)',
                        boxShadow: `0 0 10px var(--gold-glow)`
                    }} />
                    <h3 style={{
                        fontSize: 13,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: 'var(--text-muted)',
                        margin: 0
                    }}>
                        {title}
                    </h3>
                </div>
                <span style={{
                    background: 'var(--surface-2)',
                    color: 'var(--gold)',
                    fontWeight: 900,
                    padding: '3px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    border: '1px solid var(--gold-border)'
                }}>
                    {count}
                </span>
            </div>

            <div style={{ flex: 1, padding: '0 4px' }}>
                {children}
            </div>
        </div>
    );
}
