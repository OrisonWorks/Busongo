import { Series, type Candle, type Cond } from "./series";

export type BacktestConfig = {
  symbols: string[];
  from?: string;
  to?: string;
  entry: Cond[];
  exit: Cond[];
  entryJoin?: "AND" | "OR";
  exitJoin?: "AND" | "OR";
  stopLossPct?: number | null;
  takeProfitPct?: number | null;
  trailingStopPct?: number | null;
  maxHoldDays?: number | null;
  minHoldDays?: number | null;
  capital: number;
  positionPct: number;
  feeRate: number;
  benchmarkYield?: number | null;
};

export type Trade = {
  symbol: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  qty: number;
  fees: number;
  pnl: number;
  pnlPct: number;
  bars: number;
  reason: string;
};

export type BacktestResult = {
  trades: Trade[];
  equity: { date: string; equity: number; benchmark: number; drawdown: number }[];
  metrics: Record<string, number | null>;
  perSymbol: { symbol: string; trades: number; pnl: number; winRate: number | null }[];
  warnings: string[];
};

type Pos = { symbol: string; qty: number; entryPrice: number; entryDate: string; entryIdx: number; fees: number; peak: number };

export function runBacktest(cfg: BacktestConfig, data: Map<string, Candle[]>): BacktestResult {
  const warnings: string[] = [];
  const inRange = (d: string) => (!cfg.from || d >= cfg.from) && (!cfg.to || d <= cfg.to);
  const series = new Map<string, { s: Series; idx: Map<string, number> }>();
  for (const sym of cfg.symbols) {
    const bars = data.get(sym);
    if (!bars?.length) { warnings.push(`No price history for ${sym}.`); continue; }
    series.set(sym, { s: new Series(bars), idx: new Map(bars.map((b, i) => [b.date, i])) });
  }
  const dates = [...new Set([...series.values()].flatMap((x) => x.s.bars.map((b) => b.date)))].filter(inRange).sort();
  if (dates.length < 2) {
    warnings.push("Not enough trading sessions in the selected range to run a backtest.");
    return { trades: [], equity: [], metrics: {}, perSymbol: [], warnings };
  }
  let cash = cfg.capital;
  const pos = new Map<string, Pos>();
  const pending = new Map<string, "buy" | "sell">();
  const trades: Trade[] = [];
  const equity: BacktestResult["equity"] = [];
  const last = new Map<string, number>();
  const fee = (v: number) => v * cfg.feeRate;
  // Buy-and-hold benchmark: equal-weight across symbols, bought on the first session each has data in range.
  const bh = new Map<string, number>();
  let bhCash = cfg.capital;
  const perSym = cfg.capital / Math.max(1, series.size);

  const close = (p: Pos, price: number, date: string, i: number, reason: string) => {
    const gross = p.qty * price;
    const f = fee(gross);
    cash += gross - f;
    const cost = p.qty * p.entryPrice + p.fees;
    const pnl = gross - f - cost;
    trades.push({ symbol: p.symbol, entryDate: p.entryDate, entryPrice: p.entryPrice, exitDate: date, exitPrice: price, qty: p.qty, fees: p.fees + f, pnl, pnlPct: (pnl / cost) * 100, bars: i - p.entryIdx, reason });
    pos.delete(p.symbol);
  };

  for (const date of dates) {
    for (const [sym, { s, idx }] of series) {
      const i = idx.get(date);
      if (i == null) continue;
      const bar = s.bars[i];
      last.set(sym, bar.close);
      if (!bh.has(sym)) {
        const q = (perSym / (1 + cfg.feeRate)) / bar.close;
        bh.set(sym, q);
        bhCash -= perSym;
      }
      // Orders signalled on the previous session fill at today's close (no look-ahead).
      const ord = pending.get(sym);
      pending.delete(sym);
      const p = pos.get(sym);
      if (ord === "sell" && p) close(p, bar.close, date, i, "Exit signal");
      else if (ord === "buy" && !p) {
        const equityNow = cash + [...pos.values()].reduce((a, x) => a + x.qty * (last.get(x.symbol) ?? x.entryPrice), 0);
        const budget = Math.min(cash, (equityNow * cfg.positionPct) / 100);
        const qty = Math.floor(budget / (bar.close * (1 + cfg.feeRate)));
        if (qty > 0) {
          const f = fee(qty * bar.close);
          cash -= qty * bar.close + f;
          pos.set(sym, { symbol: sym, qty, entryPrice: bar.close, entryDate: date, entryIdx: i, fees: f, peak: bar.close });
        }
      }
      const cur = pos.get(sym);
      if (cur) {
        cur.peak = Math.max(cur.peak, bar.close);
        const chg = (bar.close / cur.entryPrice - 1) * 100;
        const held = i - cur.entryIdx;
        const canExit = !cfg.minHoldDays || held >= cfg.minHoldDays;
        if (cfg.stopLossPct && chg <= -cfg.stopLossPct) close(cur, bar.close, date, i, "Stop loss");
        else if (cfg.takeProfitPct && chg >= cfg.takeProfitPct) close(cur, bar.close, date, i, "Take profit");
        else if (cfg.trailingStopPct && (bar.close / cur.peak - 1) * 100 <= -cfg.trailingStopPct) close(cur, bar.close, date, i, "Trailing stop");
        else if (cfg.maxHoldDays && held >= cfg.maxHoldDays) close(cur, bar.close, date, i, "Max hold");
        else if (canExit && s.all(cfg.exit, i, cfg.exitJoin)) pending.set(sym, "sell");
      } else if (s.all(cfg.entry, i, cfg.entryJoin)) pending.set(sym, "buy");
    }
    const eq = cash + [...pos.values()].reduce((a, x) => a + x.qty * (last.get(x.symbol) ?? x.entryPrice), 0);
    const bench = bhCash + [...bh].reduce((a, [sym, q]) => a + q * (last.get(sym) ?? 0), 0);
    const peak = Math.max(eq, ...equity.map((e) => e.equity), cfg.capital);
    equity.push({ date, equity: eq, benchmark: bench, drawdown: (eq / peak - 1) * 100 });
  }
  const lastDate = dates[dates.length - 1];
  for (const p of [...pos.values()]) {
    const { s, idx } = series.get(p.symbol)!;
    const i = [...idx.values()].pop()!;
    close(p, s.bars[i].close, lastDate, i, "End of test");
  }
  if (equity.length) equity[equity.length - 1].equity = cash;
  return { trades, equity, metrics: metrics(cfg, trades, equity), perSymbol: perSymbol(trades), warnings };
}

function perSymbol(trades: Trade[]) {
  const m = new Map<string, Trade[]>();
  for (const t of trades) m.set(t.symbol, [...(m.get(t.symbol) || []), t]);
  return [...m].map(([symbol, ts]) => ({ symbol, trades: ts.length, pnl: ts.reduce((a, t) => a + t.pnl, 0), winRate: ts.length ? (ts.filter((t) => t.pnl > 0).length / ts.length) * 100 : null }));
}

function metrics(cfg: BacktestConfig, trades: Trade[], eq: BacktestResult["equity"]) {
  const final = eq.length ? eq[eq.length - 1].equity : cfg.capital;
  const days = eq.length > 1 ? (+new Date(eq[eq.length - 1].date) - +new Date(eq[0].date)) / 86400000 : 0;
  const yrs = days / 365.25;
  const wins = trades.filter((t) => t.pnl > 0), losses = trades.filter((t) => t.pnl <= 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0), grossLoss = -losses.reduce((a, t) => a + t.pnl, 0);
  const rets = eq.slice(1).map((e, i) => e.equity / eq[i].equity - 1);
  const mean = rets.reduce((a, r) => a + r, 0) / Math.max(1, rets.length);
  const sd = Math.sqrt(rets.reduce((a, r) => a + (r - mean) ** 2, 0) / Math.max(1, rets.length - 1));
  const downside = Math.sqrt(rets.filter((r) => r < 0).reduce((a, r) => a + r * r, 0) / Math.max(1, rets.length));
  const ppy = eq.length > 1 && yrs > 0 ? eq.length / yrs : 252;
  const cagr = yrs > 0.05 ? ((final / cfg.capital) ** (1 / yrs) - 1) * 100 : null;
  const maxDD = Math.min(0, ...eq.map((e) => e.drawdown));
  const bench = eq.length ? eq[eq.length - 1].benchmark : cfg.capital;
  const inMarket = eq.length ? trades.reduce((a, t) => a + t.bars, 0) / eq.length : 0;
  return {
    finalEquity: final,
    totalReturn: (final / cfg.capital - 1) * 100,
    cagr,
    maxDrawdown: maxDD,
    calmar: cagr != null && maxDD < 0 ? cagr / -maxDD : null,
    sharpe: sd > 0 ? (mean / sd) * Math.sqrt(ppy) : null,
    sortino: downside > 0 ? (mean / downside) * Math.sqrt(ppy) : null,
    trades: trades.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : null,
    avgWin: wins.length ? grossWin / wins.length : null,
    avgLoss: losses.length ? -grossLoss / losses.length : null,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    expectancy: trades.length ? (grossWin - grossLoss) / trades.length : null,
    avgBars: trades.length ? trades.reduce((a, t) => a + t.bars, 0) / trades.length : null,
    totalFees: trades.reduce((a, t) => a + t.fees, 0),
    exposure: Math.min(100, inMarket * 100),
    benchmarkReturn: (bench / cfg.capital - 1) * 100,
    riskFreeReturn: cfg.benchmarkYield != null && yrs > 0 ? ((1 + cfg.benchmarkYield / 100) ** yrs - 1) * 100 : null,
    sessions: eq.length,
  };
}
