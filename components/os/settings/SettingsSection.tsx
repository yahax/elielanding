"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <section className="luxury-card" style={{ padding: 16, borderRadius: 18 }}>
      <div style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {Icon ? <Icon size={15} style={{ color: "var(--gold)" }} /> : null}
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{title}</h3>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
