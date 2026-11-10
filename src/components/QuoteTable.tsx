"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Quote } from "@/lib/market";
import { Chg } from "./ui";
import { ccy, compact, fmtInt } from "@/lib/format";

type Key = "symbol" | "name" | "sector" | "close" | "change" | "changePct" | "volume" | "value" | "trades" | "bid" | "ask";
const COLS: [Key, string, boolean][] = [
  ["symbol", "Symbol", false], ["name", "Name", false], ["sector", "Sector", false],
  ["close", "Close", true], ["change", "Change", true], ["changePct", "% Chg", true],
  ["volume", "Volume", true], ["value", "Value", true], ["trades", "Trades", true], ["bid", "Bid", true], ["ask", "Ask", true],
];

export default function QuoteTable({ rows, base = "/stocks", showSector = true }: { rows: Quote[]; base?: string; showSector?: boolean }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 } | null>(null);
  const cols = COLS.filter(([k]) => k !== "sector" || showSector);
  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle ? rows.filter((r) => r.symbol.toLowerCase().includes(needle) || r.name.toLowerCase().includes(needle)) : rows;
    if (!sort) return filtered;
    const { k, dir } = sort;
    return [...filtered].sort((a, b) => {
      const av = a[k as keyof Quote] as string | number | null | undefined;
      const bv = b[k as keyof Quote] as string | number | null | undefined;
      const aEmpty = av == null || av === "", bEmpty = bv == null || bv === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1; if (bEmpty) return -1;
      return typeof av === "number" && typeof bv === "number" ? (av - bv) * dir : String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, q, sort]);
  const onSort = (k: Key) => setSort((s) => s != null && s.k === k ? { k, dir: (s.dir * -1) as 1 | -1 } : { k, dir: k === "symbol" || k === "name" || k === "sector" ? 1 : -1 });
  return (
    <div>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by symbol or name…" aria-label="Filter stocks" className="input mb-2 w-full max-w-xs" />
      <div className="overflow-x-auto">
        <table className="data">
          <thead><tr>{cols.map(([k, l, r]) => (
            <th key={k} className={r ? "r" : ""} aria-sort={sort?.k === k ? (sort?.dir === 1 ? "ascending" : "descending") : undefined}>
              <button type="button" onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-fg">
                {l}{sort?.k === k && <span aria-hidden>{sort?.dir === 1 ? "▲" : "▼"}</span>}
              </button>
            </th>
          ))}</tr></thead>
          <tbody>
            {view.map((x) => (
              <tr key={x.symbol}>
                <td><Link href={`${base}/${x.symbol}`} className="font-semibold text-brand">{x.symbol}</Link></td>
                <td className="max-w-[220px] truncate text-muted">{x.name}</td>
                {showSector && <td className="text-muted">{x.sector}</td>}
                <td className="num r">{ccy(x.currency, x.close)}</td>
                <td className="num r">{x.change == null ? "—" : x.change.toFixed(2)}</td>
                <td className="r"><Chg v={x.changePct} /></td>
                <td className="num r">{compact(x.volume)}</td>
                <td className="num r">{compact(x.value)}</td>
                <td className="num r">{fmtInt(x.trades)}</td>
                <td className="num r">{x.bid ?? "—"}</td>
                <td className="num r">{x.ask ?? "—"}</td>
              </tr>
            ))}
            {!view.length && <tr><td colSpan={cols.length} className="py-6 text-center text-muted">No match for “{q}”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
