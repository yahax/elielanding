'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, AlertTriangle, Shield, Bell } from 'lucide-react';
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
            const msg = err instanceof Error ? err.message : 'Erreur de chargement';
            if (!msg.includes('introuvable') && !msg.includes('not configured')) {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onSave = async () => {
        setSaving(true);
        try {
            await saveSettings(settings);
            toast.success('Configuration synchronisée');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Échec de sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="os-page animate-fade-in" style={{ paddingBottom: 100, maxWidth: 1100 }}>
            <OsToaster />
            <PageHeader
                title="Configuration Système"
                subtitle="Paramètres globaux de l'écosystème et règles d'automatisation stratégique ELIE"
                actions={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-ghost" onClick={load} style={{ width: 44, height: 44, padding: 0, borderRadius: 14, background: 'var(--surface)' }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="btn btn-primary" onClick={onSave} disabled={saving || !configured} style={{ height: 44, padding: '0 28px', borderRadius: 14, fontWeight: 900, fontSize: 13, letterSpacing: '0.05em' }}>
                            <Save size={18} style={{ marginRight: 10 }} /> {saving ? 'SYNCHRONISATION...' : 'ENREGISTRER LES MODIFICATIONS'}
                        </button>
                    </div>
                }
            />

            {loading && !settings.shop_name ? <LoadingState label="Acquisition des réglages globaux..." /> : null}
            {error ? <ErrorState message={error} onRetry={load} /> : null}

            {!configured && (
                <div className="luxury-card animate-pulse" style={{ marginBottom: 40, padding: 28, background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--danger)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--danger)' }}>Initialisation Critique Requise</h4>
                        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: '6px 0 0 0', fontWeight: 600 }}>{message || 'La table de configuration doit être initialisée dans l\'infrastructure Supabase.'}</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 32 }}>
                <div className="luxury-card" style={{ padding: 40, background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-border)' }}>
                            <Shield size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>Identité & Canaux</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>DÉSIGNATION COMMERCIALE</label>
                            <input
                                className="filter-input"
                                value={settings.shop_name}
                                onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                                style={{ height: 56, background: 'var(--bg-elevated)', borderRadius: 16, fontSize: 16, fontWeight: 700 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>EMAIL DE SERVICE CLIENT</label>
                            <input
                                className="filter-input"
                                value={settings.support_email}
                                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                style={{ height: 56, background: 'var(--bg-elevated)', borderRadius: 16, fontSize: 16, fontWeight: 700 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>TERMINAL WHATSAPP (DIRECT)</label>
                            <input
                                className="filter-input"
                                value={settings.whatsapp}
                                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                                style={{ height: 56, background: 'var(--bg-elevated)', borderRadius: 16, fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="luxury-card" style={{ padding: 40, background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-border)' }}>
                            <Bell size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>Algorithmes & Automates</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Validation Automatique</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginTop: 2 }}>Approuver les flux dès réception système</div>
                            </div>
                            <div
                                onClick={() => setSettings({ ...settings, auto_validate: !settings.auto_validate })}
                                style={{
                                    width: 52, height: 28, borderRadius: 14, background: settings.auto_validate ? 'var(--gold)' : 'var(--border)',
                                    cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', border: '1px solid var(--border)'
                                }}
                            >
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: settings.auto_validate ? 27 : 2, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Alertes Stock Maison</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginTop: 2 }}>Notifications intelligentes en seuil critique</div>
                            </div>
                            <div
                                onClick={() => setSettings({ ...settings, low_stock_alert: !settings.low_stock_alert })}
                                style={{
                                    width: 52, height: 28, borderRadius: 14, background: settings.low_stock_alert ? 'var(--gold)' : 'var(--border)',
                                    cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', border: '1px solid var(--border)'
                                }}
                            >
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: settings.low_stock_alert ? 27 : 2, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>DEVISE ÉTALON</label>
                                <input
                                    className="filter-input"
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    style={{ height: 52, background: 'var(--bg-elevated)', textAlign: 'center', fontWeight: 900, fontSize: 16, borderRadius: 14 }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>FUSEAU HORAIRE</label>
                                <input
                                    className="filter-input"
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                    style={{ height: 52, background: 'var(--bg-elevated)', textAlign: 'center', fontSize: 13, fontWeight: 800, borderRadius: 14 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
