"use client";
import { useState, useTransition } from "react";
import { TEMPLATES } from "@/lib/engine/templates";
import { runBacktestAction, saveStrategy, type RunResponse } from "@/app/(app)/backtester/actions";
import ResultView from "./ResultView";

export type SavedBasic = { template?: string; params?: Record<string, number>; symbols?: string[]; capital?: number; stopLossPct?: number | null; takeProfitPct?: number | null; from?: string };
export default function BasicBacktester({ symbols, initial, signedIn, saved }: { symbols: { symbol: string; name: string; group: string }[]; initial?: string; signedIn: boolean; saved?: SavedBasic }) {
  const savedTid = TEMPLATES.some((x) => x.id === saved?.template) ? saved!.template! : undefined;
  const [symbol, setSymbol] = useState(saved?.symbols?.[0] || initial || symbols[0]?.symbol);
  const [tid, setTid] = useState(savedTid || "macd");
  const t = TEMPLATES.find((x) => x.id === tid)!;
  const [params, setParams] = useState<Record<string, number>>(() => (savedTid ? Object.fromEntries(Object.entries(saved?.params || {}).map(([k, v]) => [`${savedTid}.${k}`, v])) : {}));
  const [capital, setCapital] = useState(saved?.capital || 100000);
  const [sl, setSl] = useState<string>(saved?.stopLossPct != null ? String(saved.stopLossPct) : "");
  const [tp, setTp] = useState<string>(saved?.takeProfitPct != null ? String(saved.takeProfitPct) : "");
  const [from, setFrom] = useState(saved?.from || "");
  const [res, setRes] = useState<RunResponse | null>(null);
  const [pending, start] = useTransition();
  const [savedMsg, setSavedMsg] = useState("");
  const vals = Object.fromEntries(t.params.map((p) => [p.key, params[`${tid}.${p.key}`] ?? p.def]));
  const cfg = () => ({ symbols: [symbol], from: from || undefined, ...t.build(vals), capital, positionPct: 100, stopLossPct: sl ? +sl : null, takeProfitPct: tp ? +tp : null });
  const groups = [...new Set(symbols.map((s) => s.group))];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="card h-fit space-y-3 p-4">
        <div><label className="label">Symbol</label>
          <select className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {groups.map((g) => <optgroup key={g} label={g}>{symbols.filter((s) => s.group === g).map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol} · {s.name}</option>)}</optgroup>)}
          </select></div>
        <div><label className="label">Strategy template</label>
          <select className="input" value={tid} onChange={(e) => setTid(e.target.value)}>{TEMPLATES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <p className="mt-1 text-xs text-muted">{t.description}</p></div>
        {t.params.map((p) => (
          <div key={p.key}><label className="label">{p.label}</label><input type="number" className="input" value={vals[p.key]} onChange={(e) => setParams({ ...params, [`${tid}.${p.key}`]: +e.target.value })} /></div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Capital (K)</label><input type="number" className="input" value={capital} onChange={(e) => setCapital(+e.target.value)} /></div>
          <div><label className="label">Start date</label><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="label">Stop loss %</label><input type="number" className="input" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="none" /></div>
          <div><label className="label">Take profit %</label><input type="number" className="input" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="none" /></div>
        </div>
        <p className="text-xs text-muted">Signals are taken on the close and filled at the next session&apos;s close. LuSE fees of 1.375% are charged on each side (0.1% for crypto).</p>
        <button disabled={pending} className="btn btn-primary w-full" onClick={() => start(async () => setRes(await runBacktestAction("basic", cfg())))}>{pending ? "Running…" : "Run backtest"}</button>
        {signedIn && <button className="btn btn-ghost w-full" onClick={async () => { const n = prompt("Strategy name", `${t.name} · ${symbol}`); if (n) { await saveStrategy(n, "basic", { template: tid, params: vals, ...cfg() }); setSavedMsg("Saved to My Strategies"); } }}>Save strategy</button>}
        {savedMsg && <p className="text-xs text-up">{savedMsg}</p>}
      </div>
      <div className="min-w-0">{res?.error ? <div className="card p-4 text-sm text-down">{res.error}</div> : res?.result ? <ResultView res={res} signedIn={signedIn} /> : <div className="card grid h-64 place-items-center text-sm text-muted">Pick a symbol and template, then run the backtest.</div>}</div>
    </div>
  );
}
