"use client";
import { useState, useTransition } from "react";
import type { Cond } from "@/lib/engine/series";
import { runBacktestAction, saveStrategy, type RunResponse } from "@/app/(app)/backtester/actions";
import CondBuilder from "./CondBuilder";
import ResultView from "./ResultView";

export default function AdvancedBacktester({ symbols, signedIn, initial }: { symbols: { symbol: string; name: string; group: string }[]; signedIn: boolean; initial?: Record<string, unknown> }) {
  const i = (initial || {}) as Partial<{ symbols: string[]; entry: Cond[]; exit: Cond[]; entryJoin: "AND" | "OR"; exitJoin: "AND" | "OR" }>;
  const [sel, setSel] = useState<string[]>(i.symbols || [symbols[0]?.symbol]);
  const [entry, setEntry] = useState<Cond[]>(i.entry || [{ left: { ind: "rsi", period: 14 }, op: "lt", right: { ind: "number", value: 35 } }, { left: { ind: "close" }, op: "gt", right: { ind: "sma", period: 100 } }]);
  const [exit, setExit] = useState<Cond[]>(i.exit || [{ left: { ind: "rsi", period: 14 }, op: "gt", right: { ind: "number", value: 65 } }]);
  const [ej, setEj] = useState<"AND" | "OR">(i.entryJoin || "AND");
  const [xj, setXj] = useState<"AND" | "OR">(i.exitJoin || "OR");
  const [o, setO] = useState({ capital: 100000, positionPct: 25, stopLossPct: "", takeProfitPct: "", trailingStopPct: "", maxHoldDays: "", minHoldDays: "", from: "", to: "", feeRate: "" });
  const [res, setRes] = useState<RunResponse | null>(null);
  const [pending, start] = useTransition();
  const n = (s: string) => (s === "" ? null : +s);
  const cfg = () => ({ symbols: sel, entry, exit, entryJoin: ej, exitJoin: xj, capital: o.capital, positionPct: o.positionPct, stopLossPct: n(o.stopLossPct), takeProfitPct: n(o.takeProfitPct), trailingStopPct: n(o.trailingStopPct), maxHoldDays: n(o.maxHoldDays), minHoldDays: n(o.minHoldDays), from: o.from || undefined, to: o.to || undefined, ...(o.feeRate ? { feeRate: +o.feeRate / 100 } : {}) });
  const field = (k: keyof typeof o, label: string, type = "number") => (
    <div><label className="label">{label}</label><input type={type} className="input" value={o[k]} placeholder="none" onChange={(e) => setO({ ...o, [k]: type === "number" && (k === "capital" || k === "positionPct") ? +e.target.value : e.target.value })} /></div>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <div className="mb-2 text-sm font-semibold">Universe ({sel.length})</div>
          <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
            {[...new Set(symbols.map((s) => s.group))].map((g) => (
              <div key={g}>
                <div className="mt-2 flex justify-between text-xs text-muted"><span>{g}</span><button className="text-brand" onClick={() => setSel([...new Set([...sel, ...symbols.filter((s) => s.group === g).map((s) => s.symbol)])])}>select all</button></div>
                {symbols.filter((s) => s.group === g).map((s) => (
                  <label key={s.symbol} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.includes(s.symbol)} onChange={(e) => setSel(e.target.checked ? [...sel, s.symbol] : sel.filter((x) => x !== s.symbol))} />{s.symbol} <span className="truncate text-xs text-muted">{s.name}</span></label>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="card space-y-4 p-4 lg:col-span-2">
          <div><div className="mb-2 text-sm font-semibold text-up">Entry conditions</div><CondBuilder conds={entry} onChange={setEntry} join={ej} onJoin={setEj} /></div>
          <div><div className="mb-2 text-sm font-semibold text-down">Exit conditions</div><CondBuilder conds={exit} onChange={setExit} join={xj} onJoin={setXj} /></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {field("capital", "Capital (K)")}{field("positionPct", "Position size % of equity")}{field("stopLossPct", "Stop loss %")}{field("takeProfitPct", "Take profit %")}{field("trailingStopPct", "Trailing stop %")}
            {field("minHoldDays", "Min hold (bars)")}{field("maxHoldDays", "Max hold (bars)")}{field("from", "From", "date")}{field("to", "To", "date")}{field("feeRate", "Fee % per side (override)")}
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={pending || !sel.length} className="btn btn-primary" onClick={() => start(async () => setRes(await runBacktestAction("advanced", cfg())))}>{pending ? "Running…" : "Run backtest"}</button>
            {signedIn && <button className="btn btn-ghost" onClick={async () => { const nm = prompt("Strategy name"); if (nm) await saveStrategy(nm, "advanced", cfg()); }}>Save strategy</button>}
            {res?.usage && <span className="self-center text-xs text-muted">{res.usage.used}/{res.usage.limit} advanced backtests used this month</span>}
          </div>
        </div>
      </div>
      {res?.error ? <div className="card p-4 text-sm text-down">{res.error}</div> : res?.result ? <ResultView res={res} signedIn={signedIn} /> : null}
    </div>
  );
}
