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
}: SettingsInputRowProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <div style={{ position: "relative" }}>
        <input
          className="filter-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          min={min}
          max={max}
          style={{ width: "100%", height: 42, borderRadius: 12, paddingRight: suffix ? 48 : 12 }}
        />
        {suffix ? (
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11,
              color: "var(--text-dim)",
              fontWeight: 800,
            }}
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

