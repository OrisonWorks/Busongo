"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { PRODUCTS, RESOURCES, SOLUTIONS, type NavItem } from "@/config/nav";
import { PAYMENTS_ENABLED } from "@/config/features";
import A11yMenu from "./A11yMenu";

function Menu({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="group relative">
      <button type="button" aria-haspopup="true" className="px-3 py-2 text-sm text-muted hover:text-fg">{label} <span aria-hidden="true">▾</span></button>
      <div className={`invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${wide ? "w-[860px]" : "w-80"}`}>
        <div className="card p-4 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
const Item = ({ i }: { i: NavItem }) => (
  <Link href={i.href} className="block rounded-md px-2 py-1.5 hover:bg-panel2">
    <div className="text-sm font-medium">{i.label}</div>
    {i.desc && <div className="text-xs text-muted">{i.desc}</div>}
  </Link>
);

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <img src="/logo.png" alt={`${brand.name} logo`} className="h-8 w-8 rounded-lg" />
      <span>{brand.name}</span>
    </Link>
  );
}

export default function Navbar({ user, lang = "en" }: { user: { name: string | null; email: string; plan: string; role: string } | null; lang?: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 items-center lg:flex">
          <Link href="/kwacha-today" className="px-3 py-2 text-sm font-medium text-brand hover:text-fg">Kwacha Today</Link>
          <Menu label="Products" wide>
            <div className="grid grid-cols-4 gap-4">
              {PRODUCTS.map((g) => (
                <div key={g.label}>
                  <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-brand">{g.label}</div>
                  {g.items.map((i) => <Item key={i.href} i={i} />)}
                </div>
              ))}
            </div>
          </Menu>
          <Menu label="Solutions">{SOLUTIONS.map((i) => <Item key={i.href} i={i} />)}</Menu>
          <Menu label="Resources">{RESOURCES.map((i) => <Item key={i.href} i={i} />)}</Menu>
          {PAYMENTS_ENABLED && <Link href="/pricing" className="px-3 py-2 text-sm text-muted hover:text-fg">Pricing</Link>}
          <Link href="/market" className="px-3 py-2 text-sm text-muted hover:text-fg">Markets</Link>
        </nav>
        <div className="ml-auto lg:ml-0"><A11yMenu lang={lang} /></div>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/admin" className="btn btn-ghost">Admin</Link>}
              <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
              <Link href="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-panel2 text-sm font-semibold" title={user.email}>
                {(user.name || user.email)[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link href={`/login?next=${encodeURIComponent(path)}`} className="btn btn-ghost">Sign in</Link>
              <Link href="/register" className="btn btn-primary">Start free</Link>
            </>
          )}
        </div>
        <button type="button" className="px-2 text-xl lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>☰</button>
      </div>
      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-line p-4 lg:hidden" onClick={() => setOpen(false)}>
          <Link href="/kwacha-today" className="mb-3 block py-1 font-semibold text-brand">Kwacha Today</Link>
          {PRODUCTS.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="text-xs font-semibold uppercase text-brand">{g.label}</div>
              {g.items.map((i) => <Link key={i.href} href={i.href} className="block py-1 text-sm">{i.label}</Link>)}
            </div>
          ))}
          {PAYMENTS_ENABLED && <Link href="/pricing" className="block py-1 text-sm">Pricing</Link>}
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase text-brand">Resources</div>
            {RESOURCES.map((i) => <Link key={i.href} href={i.href} className="block py-1 text-sm">{i.label}</Link>)}
          </div>
          <div className="mt-3 flex gap-2">
            {user ? <Link href="/dashboard" className="btn btn-primary">Dashboard</Link> : <><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/register" className="btn btn-primary">Start free</Link></>}
          </div>
        </div>
      )}
    </header>
  );
}
