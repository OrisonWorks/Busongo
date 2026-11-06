import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { pct, tone } from "@/lib/format";

export function PageHeader({ title, subtitle, children, crumbs }: { title: string; subtitle?: ReactNode; children?: ReactNode; crumbs?: { href: string; label: string }[] }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumbs && (
          <div className="mb-1 flex gap-1 text-xs text-muted">
            {crumbs.map((c) => (
              <span key={c.href}>
                <Link href={c.href} className="hover:text-fg">{c.label}</Link> /
              </span>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ title, children, className, action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={clsx("card p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, change }: { label: string; value: ReactNode; sub?: ReactNode; change?: number | null }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="num mt-1 text-xl font-semibold">{value}</div>
      {change !== undefined && <div className={clsx("num text-xs", tone(change))}>{pct(change)}</div>}
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Chg({ v, d = 2 }: { v: number | null | undefined; d?: number }) {
  return <span className={clsx("num", tone(v))}>{pct(v, d)}</span>;
}

export function Badge({ children, color = "slate" }: { children: ReactNode; color?: "slate" | "green" | "red" | "amber" | "blue" }) {
  const c = { slate: "bg-slate-500/15 text-slate-300", green: "bg-emerald-500/15 text-emerald-300", red: "bg-red-500/15 text-red-300", amber: "bg-amber-500/15 text-amber-300", blue: "bg-sky-500/15 text-sky-300" }[color];
  return <span className={clsx("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", c)}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>;
}

export function Notice({ children, tone: t = "amber" }: { children: ReactNode; tone?: "amber" | "blue" }) {
  return <div className={clsx("mb-4 rounded-lg border px-4 py-3 text-sm", t === "amber" ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-sky-500/30 bg-sky-500/10 text-sky-200")}>{children}</div>;
}

export function Tabs({ items, active }: { items: { href: string; label: string }[]; active: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={clsx("-mb-px border-b-2 px-3 py-2 text-sm", active === i.href ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg")}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}
