export type ExplainInput = { metrics: Record<string, number | null>; warnings?: string[]; perSymbol?: { symbol: string; trades: number; pnl: number; winRate: number | null }[] };

const p = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const k = (v: number) => `K${Math.round(v).toLocaleString("en-US")}`;

/** Deterministic plain-English explanation of backtest metrics (used when no AI provider is configured). */
export function explainRules({ metrics: m, perSymbol = [] }: ExplainInput): string[] {
  const out: string[] = [];
  const tr = m.totalReturn, bh = m.benchmarkReturn, rf = m.riskFreeReturn, dd = m.maxDrawdown, n = m.trades ?? 0;
  if (!n) return ["The strategy never traded, so there is nothing to judge yet. Loosen the entry rules, lengthen the test period or increase the position size."];
  if (tr != null && bh != null) out.push(`The strategy returned ${p(tr)} against ${p(bh)} for simply buying and holding, so it ${tr >= bh ? `beat buy-and-hold by ${(tr - bh).toFixed(1)} points` : `lagged buy-and-hold by ${(bh - tr).toFixed(1)} points`}.`);
  if (tr != null && rf != null) out.push(tr >= rf ? `It also beat the 364-day GRZ T-bill (${p(rf)} over the same period), which is the risk-free bar any Zambian strategy has to clear.` : `It did worse than a risk-free 364-day GRZ T-bill (${p(rf)} over the same period); you would have earned more with no equity risk.`);
  if (dd != null) {
    const d = Math.abs(dd);
    out.push(d >= 30 ? `The worst peak-to-trough fall was ${d.toFixed(1)}%. That is a deep drawdown that most people abandon a strategy during.` : d >= 15 ? `The worst peak-to-trough fall was ${d.toFixed(1)}%, a meaningful but survivable drawdown.` : `The worst peak-to-trough fall was only ${d.toFixed(1)}%, so the ride was relatively smooth.`);
  }
  if (m.winRate != null) {
    const pf = m.profitFactor;
    out.push(`${m.winRate.toFixed(0)}% of trades were winners${pf != null ? ` and the profit factor was ${pf.toFixed(2)} (${pf >= 1.5 ? "gains comfortably outweighed losses" : pf >= 1 ? "gains only slightly outweighed losses" : "losses outweighed gains"})` : ""}.`);
  }
  out.push(n < 10 ? `There were only ${n} trades, which is too few to tell skill from luck. Test more symbols or a longer period before trusting it.` : n < 30 ? `${n} trades is a modest sample; treat the result as a promising lead rather than proof.` : `${n} trades is a reasonable sample size.`);
  const final = m.finalEquity, fees = m.totalFees;
  if (fees != null && final != null && tr != null) {
    const capital = final / (1 + tr / 100);
    const pct = (fees / capital) * 100;
    out.push(`Trading costs came to ${k(fees)} (${pct.toFixed(1)}% of starting capital)${pct > 5 ? ". Costs are a big drag, so fewer, longer trades may do better" : ""}.`);
  }
  if (m.exposure != null) out.push(`Money was invested ${m.exposure.toFixed(0)}% of the time; the rest sat in cash.`);
  if (perSymbol.length > 1) {
    const best = [...perSymbol].sort((a, b) => b.pnl - a.pnl);
    out.push(`Best contributor: ${best[0].symbol} (${k(best[0].pnl)}); weakest: ${best.at(-1)!.symbol} (${k(best.at(-1)!.pnl)}).`);
  }
  out.push("Past performance does not guarantee future results, and rules tuned to past data often do worse live.");
  return out;
}
