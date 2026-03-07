'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DASHBOARD_PASSWORD = 'elie_admin_2024'; // In a real static app, this would be in env, but inlined for reliability

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Static-compatible auth: logic is handled entirely on client
        if (password === DASHBOARD_PASSWORD) {
            localStorage.setItem('elie_session', 'authenticated');
            localStorage.setItem('elie_session_expiry', (Date.now() + 86400000).toString()); // 24h
            router.push('/os');
            router.refresh();
        } else {
            setError('Mot de passe incorrect.');
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div
                        className="login-logo-text"
                        style={{
                            background: 'linear-gradient(135deg, #c9a84c 0%, #e8cc7a 50%, #c9a84c 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        ELIE
                    </div>
                    <div className="login-logo-sub">Operating System · Accès sécurisé</div>

                    <div
                        style={{
                            width: 60,
                            height: 2,
                            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
                            margin: '16px auto 0',
                        }}
                    />
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

                    {error && (
                        <div
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 8,
                                padding: '10px 14px',
                                fontSize: 13,
                                color: 'var(--danger)',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? 'Connexion en cours…' : 'Se connecter →'}
                    </button>
                </form>

                <div
                    style={{
                        textAlign: 'center',
                        marginTop: 24,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                    }}
                >
                    Accès réservé à l&apos;équipe ELIE Parfum
                </div>
            </div>
        </div>
    );
}
