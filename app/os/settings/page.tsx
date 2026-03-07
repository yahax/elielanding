'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSettings, saveSettings } from '@/lib/os/api';
import type { ShopSettingsPayload } from '@/lib/os/types';
import { OsToaster } from '@/components/ui/OsToaster';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';

const DEFAULT_SETTINGS: ShopSettingsPayload = {
    shop_name: 'ELIE PERFUMES',
    support_email: 'contact@elie.ma',
    whatsapp: '+212 600 000 000',
    auto_validate: false,
    low_stock_alert: true,
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<ShopSettingsPayload>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configured, setConfigured] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchSettings();
            setSettings(response.settings || DEFAULT_SETTINGS);
            setConfigured(response.configured);
            setMessage(response.message || '');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onSave = async () => {
        setSaving(true);
        try {
            await saveSettings(settings);
            toast.success('Paramètres sauvegardés');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="os-page" style={{ maxWidth: 980 }}>
            <OsToaster />

            <PageHeader
                title="Paramètres ELIE OS"
                subtitle="Configuration globale de la boutique et des règles opérationnelles"
                actions={
                    <>
                        <button className="btn-ghost" onClick={load} style={{ width: 40, height: 40, padding: 0 }}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="btn btn-primary" onClick={onSave} disabled={saving || !configured}>
                            <Save size={14} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                        </button>
                    </>
                }
            />

            {loading ? <LoadingState label="Chargement de la configuration boutique." /> : null}

            {error ? (
                <ErrorState message={error} onRetry={load} />
            ) : null}

            {!configured ? (
                <div style={{
                    marginBottom: 24,
                    padding: 24,
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16
                }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, color: 'var(--text)', marginBottom: 4, fontSize: 16 }}>Configuration Requise</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
                            {message || 'La table des réglages n\'est pas encore initialisée dans votre base de données Supabase.'}
                        </div>
                    </div>
                </div>
            ) : null}

            <div style={{
                display: loading ? 'none' : 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 32,
                paddingBottom: 40
            }}>
                {/* General Settings */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 32, padding: 32 }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 900 }}>Identité & Contact</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nom de la boutique</span>
                            <input
                                className="filter-input"
                                style={{ height: 48, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 16px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}
                                value={settings.shop_name}
                                onChange={(e) => setSettings((prev) => ({ ...prev, shop_name: e.target.value }))}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email Support</span>
                            <input
                                className="filter-input"
                                style={{ height: 48, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 16px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}
                                value={settings.support_email}
                                onChange={(e) => setSettings((prev) => ({ ...prev, support_email: e.target.value }))}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ligne WhatsApp</span>
                            <input
                                className="filter-input"
                                style={{ height: 48, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 16px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}
                                value={settings.whatsapp}
                                onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp: e.target.value }))}
                            />
                        </label>
                    </div>
                </div>

                {/* Automation & Rules */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 32, padding: 32 }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 900 }}>Automatisation & Alertes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Validation Automatique</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>Valider les commandes dès réception (E-commerce pur)</div>
                            </div>
                            <input
                                type="checkbox"
                                style={{ width: 44, height: 24, cursor: 'pointer', appearance: 'none', background: settings.auto_validate ? 'var(--gold)' : 'rgba(255,255,255,0.1)', borderRadius: 12, position: 'relative', transition: 'all 0.3s' }}
                                checked={settings.auto_validate}
                                onChange={(e) => setSettings((prev) => ({ ...prev, auto_validate: e.target.checked }))}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Alertes Stock Faible</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>Notifications IA en cas de seuil critique atteint</div>
                            </div>
                            <input
                                type="checkbox"
                                style={{ width: 44, height: 24, cursor: 'pointer', appearance: 'none', background: settings.low_stock_alert ? 'var(--gold)' : 'rgba(255,255,255,0.1)', borderRadius: 12, position: 'relative', transition: 'all 0.3s' }}
                                checked={settings.low_stock_alert}
                                onChange={(e) => setSettings((prev) => ({ ...prev, low_stock_alert: e.target.checked }))}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Devise active</span>
                                <input
                                    className="filter-input"
                                    style={{ height: 48, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 16px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}
                                    value={settings.currency}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
                                />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Timezone</span>
                                <input
                                    className="filter-input"
                                    style={{ height: 48, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 16px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}
                                    value={settings.timezone}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
