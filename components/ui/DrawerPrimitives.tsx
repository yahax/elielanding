"use client";

import type { ReactNode } from "react";

function classes(base: string, extra?: string): string {
  return `${base} ${extra ?? ""}`.trim();
}

export function DrawerHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={classes("os-drawer-header", className)}>
      <div className="os-drawer-header-main">
        {eyebrow ? <div className="os-drawer-eyebrow">{eyebrow}</div> : null}
        <h3 className="os-drawer-title">{title}</h3>
        {subtitle ? <div className="os-drawer-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="os-drawer-header-actions">{actions}</div> : null}
    </header>
  );
}

export function DrawerSection({
  title,
  subtitle,
  children,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes("luxury-card os-drawer-section", className)}>
      {title ? <div className="os-drawer-section-title">{title}</div> : null}
      {subtitle ? <div className="os-drawer-section-subtitle">{subtitle}</div> : null}
      {children}
    </section>
  );
}
