'use client';

import { useState, useEffect } from 'react';
import {
    Save, Globe, Bell, Shield, Palette,
    Link, Mail, Phone, MapPin, CreditCard,
    Smartphone, Lock, Layout, RefreshCw, CheckCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        shop_name: 'ELIE Perfumes',
        shop_email: 'contact@elie-luxury.com',
        shop_phone: '+212 600 000 000',
        currency: 'MAD',
        notifications_email: true,
        notifications_whatsapp: true,
        theme: 'premium-gold',
        delivery_fee: 40,
        free_delivery_threshold: 500
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            const supabase = createClient();
            try {
                const { data, error } = await supabase
                    .from('shop_settings')
                    .select('*')
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                if (data) {
                    setSettings({
                        shop_name: data.shop_name,
                        shop_email: data.shop_email,
                        shop_phone: data.shop_phone,
                        currency: data.currency,
                        notifications_email: data.notifications_email,
                        notifications_whatsapp: data.notifications_whatsapp,
                        theme: data.theme,
                        delivery_fee: data.delivery_fee,
                        free_delivery_threshold: data.free_delivery_threshold
                    });
                }
            } catch (err) {
                console.error('[Settings] Load error:', err);
                toast.error('Erreur lors du chargement des réglages');
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const supabase = createClient();
        try {
            // Since we only have one settings record, we upsert based on a known ID or just upsert the whole thing
            // For simplicity, we'll try to update the first record or insert if none exists.
            // In a real app, you might use a fixed 'default' slug or ID.

            const { data: existing } = await supabase.from('shop_settings').select('id').limit(1);

            let result;
            if (existing && existing.length > 0) {
                result = await supabase
                    .from('shop_settings')
                    .update({ ...settings, updated_at: new Date().toISOString() })
                    .eq('id', existing[0].id);
            } else {
                result = await supabase
                    .from('shop_settings')
                    .insert([{ ...settings, updated_at: new Date().toISOString() }]);
            }

            if (result.error) throw result.error;

            toast.success('Réglages sauvegardés avec succès');
        } catch (err) {
            console.error('[Settings] Save error:', err);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" />
            <span style={{ marginLeft: 12, fontWeight: 700 }}>Initialisation du centre de contrôle…</span>
        </div>
    );

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <Toaster position="top-right" />

            <div className="page-header" style={{ marginBottom: 40 }}>
                <div>
                    <h2 className="page-title">Configuration Système</h2>
                    <p className="page-subtitle">Pilotez votre écosystème e-commerce ELIE</p>
                </div>
                <button
                    className="btn"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        height: 48, background: 'var(--text)', color: '#FFF', border: 'none',
                        padding: '0 32px', fontWeight: 900, borderRadius: 14,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                >
                    {isSaving ? 'SYNCHRONISATION...' : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Save size={18} /> ENREGISTRER
                        </div>
                    )}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>

                {/* General Info */}
                <div className="card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                        <Globe size={20} style={{ color: 'var(--gold)' }} />
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Général & Identité</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>NOM DE LA BOUTIQUE</label>
                            <input
                                className="filter-input"
                                value={settings.shop_name}
                                onChange={e => setSettings({ ...settings, shop_name: e.target.value })}
                                style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, padding: '0 20px', fontWeight: 700 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>EMAIL DE CONTACT</label>
                            <input
                                className="filter-input"
                                value={settings.shop_email}
                                onChange={e => setSettings({ ...settings, shop_email: e.target.value })}
                                style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, padding: '0 20px', fontWeight: 700 }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>DEVISE</label>
                                <select
                                    className="filter-select"
                                    value={settings.currency}
                                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                                    style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 700 }}
                                >
                                    <option value="MAD">Dirham (MAD)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="USD">Dollar ($)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>THÈME</label>
                                <select
                                    className="filter-select"
                                    value={settings.theme}
                                    onChange={e => setSettings({ ...settings, theme: e.target.value })}
                                    style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 700 }}
                                >
                                    <option value="premium-gold">Premium Gold</option>
                                    <option value="dark-luxury">Dark Luxury</option>
                                    <option value="classic">Classic White</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                        <Bell size={20} style={{ color: 'var(--gold)' }} />
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Canaux de Notifications</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 900 }}>Alertes Email Admin</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Recevoir une copie de chaque commande</div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={settings.notifications_email} onChange={e => setSettings({ ...settings, notifications_email: e.target.checked })} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 900 }}>Flux WhatsApp Business</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Activer les raccourcis de contact direct</div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={settings.notifications_whatsapp} onChange={e => setSettings({ ...settings, notifications_whatsapp: e.target.checked })} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Shipping & Delivery */}
                <div className="card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                        <Smartphone size={20} style={{ color: 'var(--gold)' }} />
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Livraison & Logistique</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>FRAIS DE PORT (MAD)</label>
                            <input
                                type="number" className="filter-input"
                                value={settings.delivery_fee}
                                onChange={e => setSettings({ ...settings, delivery_fee: Number(e.target.value) })}
                                style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, padding: '0 20px', fontWeight: 800 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>SEUIL FRANCHISE (MAD)</label>
                            <input
                                type="number" className="filter-input"
                                value={settings.free_delivery_threshold}
                                onChange={e => setSettings({ ...settings, free_delivery_threshold: Number(e.target.value) })}
                                style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, padding: '0 20px', fontWeight: 800 }}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: 24, padding: 20, background: 'var(--gold-glow)', borderRadius: 16, border: '1px dashed var(--gold)', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <CheckCircle size={14} style={{ color: 'var(--gold)' }} /> Règle de livraison calculée:
                        </div>
                        Gratuite à partir de {settings.free_delivery_threshold} {settings.currency}, sinon {settings.delivery_fee} {settings.currency} fixes.
                    </div>
                </div>

                {/* Security Section */}
                <div className="card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                        <Lock size={20} style={{ color: 'var(--gold)' }} />
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Sécurité du Cockpit</h3>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600 }}>
                        L'accès à l'OS ELIE est protégé par authentification Supabase. Vos clés d'API sont chiffrées au repos.
                    </div>
                    <button className="btn btn-ghost" style={{ width: '100%', height: 48, borderRadius: 12, fontSize: 13, fontWeight: 800 }}>REVOQUER TOUTES LES SESSIONS</button>
                    <button className="btn btn-ghost" style={{ width: '100%', height: 48, borderRadius: 12, fontSize: 13, fontWeight: 800, marginTop: 10 }}>MODIFIER MOT DE PASSE</button>
                </div>

            </div>

            <style jsx>{`
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 50;
                    height: 28;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #E2E8F0;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 20;
                    width: 20;
                    left: 4;
                    bottom: 4;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: var(--gold);
                }
                input:checked + .slider:before {
                    transform: translateX(22px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                .card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.04); }
            `}</style>
        </div>
    );
}
