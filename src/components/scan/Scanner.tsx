"use client";
import { useState, useTransition } from "react";
import DescribeBox from "@/components/ai/DescribeBox";
import Link from "next/link";
import type { Cond } from "@/lib/engine/series";
import { PRESET_SCANS } from "@/lib/engine/scanner";
import { scanAction, saveScan } from "@/app/(app)/scanner/actions";
import CondBuilder from "@/components/backtest/CondBuilder";
import { compact, fmt, pct, tone } from "@/lib/format";
import { CRYPTO_ENABLED } from "@/config/features";

export type SavedScanConfig = { conds: Cond[]; join: "AND" | "OR"; asset?: "EQUITY" | "CRYPTO"; sector?: string; minValue?: string };
type Res = Awaited<ReturnType<typeof scanAction>>;
export default function Scanner({ sectors, signedIn, watchSymbols, initial }: { sectors: string[]; signedIn: boolean; watchSymbols?: string[]; initial?: SavedScanConfig }) {
  const [conds, setConds] = useState<Cond[]>(initial?.conds || PRESET_SCANS[0].config.conds);
  const [join, setJoin] = useState<"AND" | "OR">(initial?.join || "AND");
  const [asset, setAsset] = useState<"EQUITY" | "CRYPTO">(initial?.asset || "EQUITY");
  const [sector, setSector] = useState(initial?.sector || "");
  const [minValue, setMinValue] = useState(initial?.minValue || "");
  const [onlyWatch, setOnlyWatch] = useState(!!watchSymbols?.length);
  const [res, setRes] = useState<Res | null>(null);
  const [pending, start] = useTransition();
  const run = (c = conds, j = join) => start(async () => setRes(await scanAction({ conds: c, join: j, asset, sector: sector || undefined, minValue: minValue ? +minValue : undefined, symbols: onlyWatch ? watchSymbols : undefined })));
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="card h-fit p-3">
        <div className="mb-2 text-sm font-semibold">Preset scans</div>
        {[...new Set(PRESET_SCANS.map((p) => p.group))].map((g) => (
          <div key={g} className="mb-2"><div className="text-[11px] uppercase text-muted">{g}</div>
            {PRESET_SCANS.filter((p) => p.group === g).map((p) => (
              <button key={p.id} className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-panel2" onClick={() => { setConds(p.config.conds); setJoin(p.config.join); run(p.config.conds, p.config.join); }}>{p.name}<div className="text-[11px] text-muted">{p.description}</div></button>
            ))}
          </div>
        ))}
      </div>
      <div className="min-w-0 space-y-4">
        <div className="card space-y-3 p-4">
          <DescribeBox mode="scan" placeholder="e.g. RSI below 35 and volume above its 20-day average" onApply={(s) => { setConds(s.entry.length ? s.entry : s.exit); setJoin(s.entry.length ? s.entryJoin : s.exitJoin); }} />
          <CondBuilder conds={conds} onChange={setConds} join={join} onJoin={setJoin} />
          <div className="flex flex-wrap items-end gap-2">
            <div><label className="label">Market</label><select className="input" value={asset} onChange={(e) => setAsset(e.target.value as "EQUITY")}><option value="EQUITY">LuSE</option><option value="CRYPTO">{CRYPTO_ENABLED ? "Crypto" : "Crypto (demo data)"}</option></select></div>
            {asset === "EQUITY" && <div><label className="label">Sector</label><select className="input" value={sector} onChange={(e) => setSector(e.target.value)}><option value="">All</option>{sectors.map((s) => <option key={s}>{s}</option>)}</select></div>}
            <div><label className="label">Min value traded</label><input type="number" className="input w-36" value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="any" /></div>
            {!!watchSymbols?.length && <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={onlyWatch} onChange={(e) => setOnlyWatch(e.target.checked)} /> Watchlist only</label>}
            <button disabled={pending} className="btn btn-primary" onClick={() => run()}>{pending ? "Scanning…" : "Run scan"}</button>
            {signedIn && <button className="btn btn-ghost" onClick={async () => { const n = prompt("Scan name"); if (n) await saveScan(n, { conds, join, asset, sector: asset === "EQUITY" ? sector : "", minValue }); }}>Save scan</button>}
          </div>
        </div>
        {res && (
          <div className="card overflow-x-auto p-4">
            <div className="mb-2 text-sm"><b>{res.total}</b> matches{res.total > res.limit && <span className="text-amber-300"> · showing {res.limit} on your plan (<Link href="/pricing" className="underline">upgrade</Link>)</span>}</div>
            {res.hits.length ? (
              <table className="data"><thead><tr><th>Symbol</th><th>Date</th><th className="r">Close</th><th className="r">% Chg</th><th className="r">RSI(14)</th><th className="r">Value</th><th></th></tr></thead>
                <tbody>{res.hits.map((h) => <tr key={h.symbol}><td><Link className="font-semibold text-brand" href={`/${asset === "CRYPTO" ? "crypto" : "stocks"}/${h.symbol}`}>{h.symbol}</Link></td><td>{h.date}</td><td className="num r">{fmt(h.close)}</td><td className={`num r ${tone(h.changePct)}`}>{pct(h.changePct)}</td><td className="num r">{fmt(h.rsi, 1)}</td><td className="num r">{compact(h.value)}</td><td><Link href={`/backtester?symbol=${h.symbol}`} className="text-xs text-brand">Backtest</Link></td></tr>)}</tbody></table>
            ) : <p className="text-sm text-muted">No securities match these conditions on the latest session.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
