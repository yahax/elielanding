"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import styles from "./focus-os.module.css";

interface QuickOption {
  id: string;
  label: string;
  caption?: string;
  tone?: "neutral" | "warning" | "danger";
}

interface FocusQuickModalProps {
  open: boolean;
  title: string;
  description?: string;
  options: QuickOption[];
  onClose: () => void;
  onSelect: (id: string) => void;
  footer?: ReactNode;
}

export function FocusQuickModal({
  open,
  title,
  description,
  options,
  onClose,
  onSelect,
  footer,
}: FocusQuickModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.modalBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modalCard}
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className={styles.modalHead}>
              <h3>{title}</h3>
              {description ? <p>{description}</p> : null}
            </div>

            <div className={styles.modalGrid}>
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.modalOption}
                  data-tone={option.tone ?? "neutral"}
                  onClick={() => onSelect(option.id)}
                >
                  <strong>{option.label}</strong>
                  {option.caption ? <span>{option.caption}</span> : null}
                </button>
              ))}
            </div>

            {footer ? <div className={styles.modalFooter}>{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
