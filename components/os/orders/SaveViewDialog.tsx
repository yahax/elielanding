"use client";

interface SaveViewDialogProps {
  isOpen: boolean;
  name: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function SaveViewDialog({ isOpen, name, onNameChange, onClose, onConfirm }: SaveViewDialogProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center" }}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        style={{ position: "absolute", inset: 0, border: "none", background: "rgba(20,20,20,0.35)" }}
      />
      <div className="luxury-card" style={{ position: "relative", width: "min(94vw, 420px)", borderRadius: 16, padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>Sauver la vue courante</div>
        <input
          className="filter-input"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Ex: Callbacks Casablanca"
          autoFocus
          style={{ height: 40 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onConfirm} disabled={name.trim() === ""}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
