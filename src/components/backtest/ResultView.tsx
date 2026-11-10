"use client";
import { useMemo, useState } from "react";
import type { RunResponse } from "@/app/(app)/backtester/actions";
import { journalTrades } from "@/app/(app)/backtester/actions";
import PriceChart from "@/components/charts/PriceChart";
import ExplainButton from "@/components/ai/ExplainButton";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { fmt, pct, tone } from "@/lib/format";
import Glossed from "@/components/Glossed";

const GLOSS: Record<string, "yield" | "drawdown" | "sharpe" | "sortino" | "calmar" | "winrate" | "profitfactor" | "expectancy" | "exposure" | "pnl" | "tbill" | "cagr"> = {
  totalReturn: "yield", cagr: "cagr", maxDrawdown: "drawdown", sharpe: "sharpe", sortino: "sortino", calmar: "calmar",
  winRate: "winrate", profitFactor: "profitfactor", expectancy: "expectancy", exposure: "exposure", riskFreeReturn: "tbill",
};
const M: [string, string, (v: number | null) => string][] = [
  ["totalReturn", "Total return", (v) => pct(v)], ["cagr", "CAGR", (v) => pct(v)], ["maxDrawdown", "Max drawdown", (v) => pct(v)], ["sharpe", "Sharpe", (v) => fmt(v)],
  ["sortino", "Sortino", (v) => fmt(v)], ["calmar", "Calmar", (v) => fmt(v)], ["trades", "Trades", (v) => fmt(v, 0)], ["winRate", "Win rate", (v) => (v == null ? "—" : `${v.toFixed(1)}%`)],
  ["profitFactor", "Profit factor", (v) => fmt(v)], ["expectancy", "Expectancy (K)", (v) => fmt(v)], ["avgBars", "Avg bars held", (v) => fmt(v, 1)], ["totalFees", "Fees paid (K)", (v) => fmt(v)],
  ["exposure", "Time in market", (v) => (v == null ? "—" : `${v.toFixed(0)}%`)], ["benchmarkReturn", "Buy & hold", (v) => pct(v)], ["riskFreeReturn", "364-day T-bill", (v) => pct(v)], ["finalEquity", "Final equity (K)", (v) => fmt(v)],
];

export default function ResultView({ res, signedIn }: { res: RunResponse; signedIn: boolean }) {
  const r = res.result!;
  const syms = Object.keys(res.bars || {});
  const [sym, setSym] = useState(syms[0]);
  const [msg, setMsg] = useState("");
  const markers = useMemo(() => r.trades.filter((t) => t.symbol === sym).flatMap((t) => [{ date: t.entryDate, kind: "buy" as const }, { date: t.exitDate, kind: "sell" as const }]), [r.trades, sym]);
  const bars = useMemo(() => res.bars?.[sym] || [], [res.bars, sym]);
  return (
    <div className="min-w-0 space-y-4">
      {r.warnings.map((w) => <div key={w} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">{w}</div>)}
      {r.equity.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
            {M.map(([k, l, f]) => (
              <div key={k} className="card min-w-0 p-3">
                <div className="text-[11px] text-muted">{GLOSS[k] ? <Glossed k={GLOSS[k]}>{l}</Glossed> : l}</div>
                <div className={`num font-semibold ${["totalReturn", "cagr", "benchmarkReturn", "expectancy"].includes(k) ? tone(r.metrics[k]) : ""}`}>{f(r.metrics[k] ?? null)}</div>
              </div>
            ))}
          </div>
          <ExplainButton input={{ metrics: r.metrics, warnings: r.warnings, perSymbol: r.perSymbol }} />
          <div className="card p-4">
            <div className="mb-2 text-sm font-semibold">Equity curve vs buy & hold</div>
            <LineChartBox data={r.equity.map((e) => ({ ...e, equity: +e.equity.toFixed(2), benchmark: +e.benchmark.toFixed(2) }))} x="date" lines={[{ key: "equity", name: "Strategy", color: "#10b981" }, { key: "benchmark", name: "Buy & hold", color: "#64748b", dashed: true }]} />
          </div>
          <div className="card p-4">
            <div className="mb-2 text-sm font-semibold">Drawdown</div>
            <LineChartBox data={r.equity.map((e) => ({ date: e.date, dd: +e.drawdown.toFixed(2) }))} x="date" lines={[{ key: "dd", name: "Drawdown %", color: "#ef4444" }]} area height={160} unit="%" />
          </div>
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">Trades on chart</span>
              {syms.length > 1 && <select className="input w-auto" value={sym} onChange={(e) => setSym(e.target.value)}>{syms.map((s) => <option key={s}>{s}</option>)}</select>}
            </div>
            {bars.length > 1 && <PriceChart bars={bars} markers={markers} height={340} />}
          </div>
        </>
      )}
      {r.perSymbol.length > 1 && (
        <div className="card overflow-x-auto p-4"><div className="mb-2 text-sm font-semibold">By symbol</div>
          <table className="data"><thead><tr><th>Symbol</th><th className="r">Trades</th><th className="r"><Glossed k="pnl">P&L (K)</Glossed></th><th className="r"><Glossed k="winrate">Win rate</Glossed></th></tr></thead>
            <tbody>{r.perSymbol.map((p) => <tr key={p.symbol}><td>{p.symbol}</td><td className="r">{p.trades}</td><td className={`num r ${tone(p.pnl)}`}>{fmt(p.pnl)}</td><td className="r">{p.winRate == null ? "—" : p.winRate.toFixed(0) + "%"}</td></tr>)}</tbody></table>
        </div>
      )}
      <div className="card overflow-x-auto p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold">Trade list ({r.trades.length})</span>
          {signedIn && r.trades.length > 0 && <button className="btn btn-ghost" onClick={async () => { const x = await journalTrades(r.trades); setMsg(`${x.n} entries added to your journal.`); }}>Save trades to journal</button>}
        </div>
        {msg && <p className="mb-2 text-sm text-up">{msg}</p>}
        {r.trades.length ? (
          <table className="data"><thead><tr><th>Symbol</th><th>Entry</th><th className="r">Price</th><th>Exit</th><th className="r">Price</th><th className="r">Qty</th><th className="r">Fees</th><th className="r">P&L</th><th className="r">%</th><th className="r">Bars</th><th>Reason</th></tr></thead>
            <tbody>{r.trades.map((t, i) => <tr key={i}><td>{t.symbol}</td><td>{t.entryDate}</td><td className="num r">{fmt(t.entryPrice)}</td><td>{t.exitDate}</td><td className="num r">{fmt(t.exitPrice)}</td><td className="num r">{fmt(t.qty, Number.isInteger(t.qty) ? 0 : 6)}</td><td className="num r">{fmt(t.fees)}</td><td className={`num r ${tone(t.pnl)}`}>{fmt(t.pnl)}</td><td className={`num r ${tone(t.pnlPct)}`}>{pct(t.pnlPct)}</td><td className="r">{t.bars}</td><td className="text-muted">{t.reason}</td></tr>)}</tbody></table>
        ) : <p className="text-sm text-muted">No trades were triggered in this period.</p>}
      </div>
      {res.runId && <p className="text-xs text-muted">Run saved · share link: <a className="text-brand" href={`/backtester/runs/${res.runId}`}>/backtester/runs/{res.runId}</a></p>}
    </div>
  );
}
