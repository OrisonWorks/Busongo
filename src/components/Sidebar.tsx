"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SIDEBAR } from "@/config/nav";

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r border-line px-3 py-4 xl:block">
      {SIDEBAR.map((g) => (
        <div key={g.label} className="mb-4">
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.label}</div>
          {g.items.map((i) => {
            const active = path === i.href || (i.href !== "/fixed-income" && i.href !== "/backtester" && path.startsWith(i.href + "/"));
            return (
              <Link key={i.href} href={i.href} className={clsx("block rounded-md px-2 py-1.5 text-sm", active ? "bg-brand/15 text-brand" : "text-fg/80 hover:bg-panel2")}>
                {i.label}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
