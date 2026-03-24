"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function MobileOrdersFiltersDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 70 }}>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              border: "none",
              background: "rgba(20,20,20,0.38)",
              backdropFilter: "blur(4px)",
            }}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "92vh",
              background: "var(--bg)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderTop: "1px solid var(--border)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              <div style={{ fontWeight: 900, color: "var(--text)" }}>Filtres commandes</div>
              <button type="button" className="btn-ghost btn-sm" onClick={onClose} style={{ padding: 0, width: 32, height: 32 }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ overflowY: "auto", padding: 12 }}>{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
