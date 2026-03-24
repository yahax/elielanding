"use client";

import type { WhatsAppTemplate } from "@/lib/os/settings/types";
import { SettingsToggleRow } from "@/components/os/settings/SettingsToggleRow";

interface TemplateEditorCardProps {
  template: WhatsAppTemplate;
  onToggleActive: (active: boolean) => void;
  onChangeMessage: (message: string) => void;
}

export function TemplateEditorCard({ template, onToggleActive, onChangeMessage }: TemplateEditorCardProps) {
  return (
    <article className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{template.label}</div>
        <span
          style={{
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: template.active ? "var(--success-soft)" : "var(--bg-elevated)",
            color: template.active ? "var(--success)" : "var(--text-dim)",
            fontSize: 10,
            fontWeight: 900,
            padding: "3px 8px",
            textTransform: "uppercase",
          }}
        >
          {template.active ? "Actif" : "Off"}
        </span>
      </div>

      <SettingsToggleRow
        label="Template activé"
        description="Rendre ce modèle disponible dans les actions rapides."
        checked={template.active}
        onChange={onToggleActive}
      />

      <label style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Message
        </span>
        <textarea
          className="filter-input"
          value={template.message}
          onChange={(event) => onChangeMessage(event.target.value)}
          rows={3}
          style={{ width: "100%", resize: "vertical", borderRadius: 12, minHeight: 86 }}
        />
      </label>
    </article>
  );
}

