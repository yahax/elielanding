"use client";

import { motion } from "framer-motion";
import { ClipboardList, History, LogOut, PhoneCall, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import type { FocusTab } from "@/store/useFocusQueue";
import styles from "./focus-os.module.css";

interface FocusSidebarProps {
  activeView: FocusView;
  directCount: number;
  callbackCount: number;
  historyCount: number;
  onViewChange: (tab: FocusView) => void;
  onLogout: () => void;
}

interface NavItem {
  key: FocusView;
  label: string;
  icon: ReactNode;
  count?: number;
}

export type FocusView = FocusTab | "settings";

export function FocusSidebar({
  activeView,
  directCount,
  callbackCount,
  historyCount,
  onViewChange,
  onLogout,
}: FocusSidebarProps) {
  const items: NavItem[] = [
    {
      key: "direct",
      label: "Direct",
      icon: <ClipboardList size={16} />,
      count: directCount,
    },
    {
      key: "callbacks",
      label: "Callbacks",
      icon: <PhoneCall size={16} />,
      count: callbackCount,
    },
    {
      key: "history",
      label: "History",
      icon: <History size={16} />,
      count: historyCount,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings2 size={16} />,
    },
  ];

  return (
    <aside className={styles.sidebar} aria-label="Focus Navigation">
      <div className={styles.brandBlock}>
        <span className={styles.brandTop}>ELIE FOCUS</span>
        <h1 className={styles.brandTitle}>Execution OS</h1>
      </div>

      <nav className={styles.sidebarNav}>
        {items.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={styles.sidebarItem}
              data-active={isActive ? "true" : "false"}
              onClick={() => onViewChange(item.key)}
            >
              <span className={styles.sidebarItemIcon}>{item.icon}</span>
              <span className={styles.sidebarItemLabel}>{item.label}</span>
              {typeof item.count === "number" ? <span className={styles.sidebarBadge}>{item.count}</span> : <span className={styles.sidebarBadgeGhost} />}
              {isActive ? <motion.span layoutId="focus-active-pill" className={styles.sidebarActiveRail} /> : null}
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.operatorText}>Operateur ELIE</div>

        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
