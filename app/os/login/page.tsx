'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageInner() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/os/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = (await res.json()) as { error?: string };

            if (!res.ok) {
                if (res.status === 500 && data.error === 'Server configuration error') {
                    setError('Configuration serveur incomplète. Vérifiez les variables d\'environnement.');
                } else {
                    setError(data.error || 'Mot de passe incorrect.');
                }
                return;
            }

            const redirect = searchParams.get('redirect') || '/os';
            router.push(redirect);
            router.refresh();
        } catch {
            setError('Erreur réseau. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-text luxury-text-gradient">ELIE</div>
                    <div className="login-logo-sub">Operating System · Accès sécurisé</div>
                    <div className="login-logo-divider" />
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    <div>
                        <label className="form-label" htmlFor="password">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            autoFocus
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? 'Connexion en cours…' : 'Se connecter →'}
                    </button>
                </form>

                <div className="login-footer-note">Accès réservé à l&apos;équipe ELIE Parfum</div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="login-page"><div className="login-card" style={{ padding: 40, textAlign: 'center', color: '#6A5F55' }}>Chargement...</div></div>}>
            <LoginPageInner />
        </Suspense>
    );
}
