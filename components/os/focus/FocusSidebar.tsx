"use client";

import { motion } from "framer-motion";
import { ClipboardList, History, LogOut, PhoneCall, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { FocusTab } from "@/store/useFocusQueue";
import styles from "./focus-os.module.css";

interface FocusSidebarProps {
  activeTab: FocusTab;
  directCount: number;
  callbackCount: number;
  historyCount: number;
  onTabChange: (tab: FocusTab) => void;
  onLogout: () => void;
}

interface NavItem {
  key: FocusTab;
  label: string;
  hint: string;
  icon: ReactNode;
  count: number;
}

export function FocusSidebar({
  activeTab,
  directCount,
  callbackCount,
  historyCount,
  onTabChange,
  onLogout,
}: FocusSidebarProps) {
  const items: NavItem[] = [
    {
      key: "direct",
      label: "Direct",
      hint: "Queue",
      icon: <ClipboardList size={16} />,
      count: directCount,
    },
    {
      key: "callbacks",
      label: "Callbacks",
      hint: "A rappeler",
      icon: <PhoneCall size={16} />,
      count: callbackCount,
    },
    {
      key: "history",
      label: "History",
      hint: "Aujourd'hui",
      icon: <History size={16} />,
      count: historyCount,
    },
  ];

  return (
    <aside className={styles.sidebar} aria-label="Focus Navigation">
      <div className={styles.brandBlock}>
        <span className={styles.brandTop}>ELIE FOCUS</span>
        <h1 className={styles.brandTitle}>OS 2026</h1>
      </div>

      <nav className={styles.sidebarNav}>
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={styles.sidebarItem}
              data-active={isActive ? "true" : "false"}
              onClick={() => onTabChange(item.key)}
            >
              <span className={styles.sidebarItemIcon}>{item.icon}</span>
              <span className={styles.sidebarItemLabelWrap}>
                <span className={styles.sidebarItemLabel}>{item.label}</span>
                <span className={styles.sidebarItemHint}>{item.hint}</span>
              </span>
              <span className={styles.sidebarBadge}>{item.count}</span>
              {isActive ? <motion.span layoutId="focus-active-pill" className={styles.sidebarActiveRail} /> : null}
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.profileBlock}>
          <span className={styles.profileAvatar}>
            <UserRound size={14} />
          </span>
          <span className={styles.profileText}>Operateur ELIE</span>
        </div>

        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
