"use client";

interface SettingsToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function SettingsToggleRow({ label, description, checked, onChange }: SettingsToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "100%",
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--bg-elevated)",
        padding: "10px 12px",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{label}</div>
        <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{description}</div>
      </div>
      <span
        aria-hidden
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: checked ? "var(--gold)" : "var(--surface-3)",
          position: "relative",
          flexShrink: 0,
          transition: "all 180ms ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 1,
            left: checked ? 20 : 1,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 2px 6px rgba(0,0,0,.12)",
            transition: "all 180ms ease",
          }}
        />
      </span>
    </button>
  );
}

