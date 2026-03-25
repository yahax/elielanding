"use client";

import type { HTMLAttributes, ReactNode } from "react";

function classes(base: string, extra?: string): string {
  return `${base} ${extra ?? ""}`.trim();
}

export function FilterBar({
  children,
  className,
  sticky = false,
}: {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return <section className={classes(`luxury-card os-toolbar ${sticky ? "os-toolbar-sticky" : ""}`, className)}>{children}</section>;
}

export function FilterBarTop({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classes("os-toolbar-top", className)}>{children}</div>;
}

export function FilterBarTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={classes("os-toolbar-title", className)}>{children}</h2>;
}

export function FilterBarMeta({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classes("os-toolbar-meta", className)}>{children}</div>;
}

export function FilterBarActions({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div className={classes("os-toolbar-actions", className)} {...rest}>
      {children}
    </div>
  );
}

export function FilterBarRow({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div className={classes("os-toolbar-row", className)} {...rest}>
      {children}
    </div>
  );
}

export function FilterBarSearch({
  icon,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={classes("os-toolbar-search", className)} {...rest}>
      {icon}
      {children}
    </div>
  );
}

export function FilterBarChips({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div className={classes("os-toolbar-chip-row", className)} {...rest}>
      {children}
    </div>
  );
}

export function FilterField({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={classes("os-filter-field", className)} {...rest}>
      {children}
    </label>
  );
}

export function FilterFieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={classes("os-filter-field-label", className)}>{children}</span>;
}
