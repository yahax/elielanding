"use client";

interface SettingsInputRowProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "email" | "number";
  placeholder?: string;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}

export function SettingsInputRow({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  suffix,
  disabled = false,
}: SettingsInputRowProps) {
  return (
    <label className="os-settings-input-row">
      <span className="os-settings-input-label">{label}</span>
      <div className="os-settings-input-wrap">
        <input
          className="filter-input os-settings-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          min={min}
          max={max}
          disabled={disabled}
          style={{ width: "100%", height: 42, borderRadius: 12, paddingRight: suffix ? 48 : 12 }}
        />
        {suffix ? (
          <span className="os-settings-input-suffix">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}
