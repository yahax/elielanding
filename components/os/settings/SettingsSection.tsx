"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  badgeLabel?: string;
  badgeTone?: "neutral" | "success" | "warning";
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  badgeLabel,
  badgeTone = "neutral",
  children,
}: SettingsSectionProps) {
  const badgeToneClass =
    badgeTone === "success"
      ? "is-success"
      : badgeTone === "warning"
        ? "is-warning"
        : "is-neutral";

  return (
    <section className="luxury-card os-settings-section">
      <div className="os-settings-section-head">
        <div>
          <div className="os-settings-section-title-row">
            {Icon ? <Icon size={15} className="os-settings-section-icon" /> : null}
            <h3 className="os-settings-section-title">{title}</h3>
          </div>
          <p className="os-settings-section-description">{description}</p>
        </div>
        {badgeLabel ? (
          <span className={`os-settings-section-badge ${badgeToneClass}`}>
            {badgeLabel}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
