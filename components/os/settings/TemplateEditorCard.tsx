"use client";

import type { WhatsAppTemplate } from "@/lib/os/settings/types";
import { SettingsToggleRow } from "@/components/os/settings/SettingsToggleRow";

interface TemplateEditorCardProps {
  template: WhatsAppTemplate;
  onToggleActive: (active: boolean) => void;
  onChangeMessage: (message: string) => void;
  disabled?: boolean;
}

export function TemplateEditorCard({ template, onToggleActive, onChangeMessage, disabled = false }: TemplateEditorCardProps) {
  return (
    <article className={`luxury-card os-settings-template-card ${disabled ? "is-disabled" : ""}`}>
      <div className="os-settings-template-head">
        <div className="os-settings-template-title">{template.label}</div>
        <span className={`os-settings-template-status ${template.active ? "is-active" : "is-off"}`}>
          {template.active ? "Actif" : "Off"}
        </span>
      </div>

      <SettingsToggleRow
        label="Template activé"
        description="Rendre ce modèle disponible dans les actions rapides."
        checked={template.active}
        onChange={onToggleActive}
        disabled={disabled}
      />

      <label className="os-settings-template-message">
        <span className="os-settings-input-label">
          Message
        </span>
        <textarea
          className="filter-input os-settings-template-textarea"
          value={template.message}
          onChange={(event) => onChangeMessage(event.target.value)}
          disabled={disabled}
          rows={3}
          style={{ width: "100%", resize: "vertical", borderRadius: 12, minHeight: 86 }}
        />
      </label>
    </article>
  );
}
