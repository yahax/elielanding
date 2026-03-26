"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginErrorPayload = {
  error?: string;
  missing?: string[];
};

interface OsLoginFormProps {
  redirectTo: string;
}

function buildServerConfigError(payload: LoginErrorPayload): string {
  const missing = Array.isArray(payload.missing)
    ? payload.missing.map((item) => item.trim()).filter(Boolean)
    : [];

  if (missing.length === 0) {
    return "Configuration serveur incomplète. Vérifiez vos variables d'environnement.";
  }

  return `Configuration serveur incomplète: ${missing.join(", ")}.`;
}

export function OsLoginForm({ redirectTo }: OsLoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/os/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      let payload: LoginErrorPayload = {};
      try {
        payload = (await response.json()) as LoginErrorPayload;
      } catch {
        payload = {};
      }

      if (!response.ok) {
        if (response.status === 500 && payload.error === "Server configuration error") {
          setError(buildServerConfigError(payload));
        } else {
          setError(payload.error || "Mot de passe incorrect.");
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
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
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="login-footer-note">Accès réservé à l&apos;équipe ELIE Parfum</div>
      </div>
    </div>
  );
}
