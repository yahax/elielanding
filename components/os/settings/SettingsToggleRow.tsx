"use client";

interface SettingsToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggleRow({ label, description, checked, onChange, disabled = false }: SettingsToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      className={`os-settings-toggle-row ${checked ? "is-on" : "is-off"} ${disabled ? "is-disabled" : ""}`}
    >
      <div className="os-settings-toggle-copy">
        <div className="os-settings-toggle-label">{label}</div>
        <div className="os-settings-toggle-description">{description}</div>
      </div>
      <span aria-hidden className={`os-settings-toggle-track ${checked ? "is-on" : "is-off"}`}>
        <span className="os-settings-toggle-thumb" />
      </span>
    </button>
  );
}
