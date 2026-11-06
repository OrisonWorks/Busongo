import Link from "next/link";
import { brand } from "@/config/brand";
import { PRODUCTS } from "@/config/nav";
import { PLANS, PLAN_ORDER } from "@/config/plans";
import { getIndex, getQuotes, latestMacro, breadth } from "@/lib/market";
import { yieldCurve } from "@/lib/fixed-income";
import { Chg } from "@/components/ui";
import { fmt, kwacha, fmtDate } from "@/lib/format";
import { LineChartBox } from "@/components/charts/LineChartBox";

export const revalidate = 600;

export default async function Home() {
  const [quotes, lasi, macro, curve] = await Promise.all([getQuotes("EQUITY"), getIndex("LASI"), latestMacro(), yieldCurve()]);
  const l = lasi.at(-1);
  const movers = quotes.filter((q) => q.changePct != null).sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!)).slice(0, 6);
  const b = breadth(quotes);
  const features = [
    { t: "No-code backtesting", d: "Build strategies from 20+ indicators, add stops and targets, and see the real result after LuSE's 1.375% fees per side.", h: "/backtester" },
    { t: "Scanners", d: "Find LuSE stocks hitting RSI extremes, moving-average crosses, 52-week highs, volume spikes and more.", h: "/scanner" },
    { t: "Fundamentals", d: "P/E, P/B, dividend yield, ROE and margins for every listed company, with history.", h: "/fundamentals" },
    { t: "Fixed income terminal", d: "Every BoZ T-bill and GRZ bond auction, the yield curve, real yields and after-tax calculators.", h: "/fixed-income" },
    { t: "AI assistant", d: "Ask about any LuSE stock, auction or strategy. Answers are grounded in the platform's data.", h: "/aichat" },
    { t: "Market terminal", d: "LASI, movers, breadth, turnover, heatmap, Gann, Smart Money Concepts, pivots and calendars.", h: "/market" },
  ];
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,.18),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 py-20 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-line px-3 py-1 text-xs text-muted">Built for the Lusaka Securities Exchange 🇿🇲</div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              {brand.tagline.replace("#1 ", "#1 ").split(" for ")[0]} <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">for Zambian markets</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Backtest ideas on LuSE stocks without code, screen fundamentals, follow every T-bill and GRZ bond auction, and get answers from an AI analyst. Built on LuSE and Bank of Zambia data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary px-6 py-3 text-base">Start free</Link>
              <Link href="/backtester" className="btn btn-ghost px-6 py-3 text-base">Try the backtester</Link>
            </div>
            <div className="mt-8 flex gap-8 text-sm text-muted">
              <div><div className="text-2xl font-bold text-fg">{quotes.length}</div>LuSE securities</div>
              <div><div className="text-2xl font-bold text-fg">20+</div>indicators</div>
              <div><div className="text-2xl font-bold text-fg">{curve.length}</div>GRZ tenors</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-muted">LuSE All Share Index · {fmtDate(l?.date)}</div>
                  <div className="num text-3xl font-bold">{fmt(l?.value)}</div>
                </div>
                <div className="text-right text-sm"><Chg v={l?.pctChange} /><div className="text-xs text-muted">{b.advances}▲ {b.declines}▼ {b.unchanged}■</div></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {movers.map((m) => (
                  <Link key={m.symbol} href={`/stocks/${m.symbol}`} className="rounded-lg bg-panel2 p-3 hover:ring-1 hover:ring-brand/40">
                    <div className="text-sm font-semibold">{m.symbol}</div>
                    <div className="num text-xs text-muted">{kwacha(m.close)}</div>
                    <Chg v={m.changePct} />
                  </Link>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <div className="mb-2 flex justify-between text-xs text-muted"><span>GRZ yield curve (latest auctions)</span><span>MPR {fmt(macro.MPR?.value)}% · Inflation {fmt(macro.INFLATION?.value)}%</span></div>
              <LineChartBox data={curve} x="tenor" lines={[{ key: "yield", name: "Yield %", color: "#f59e0b" }]} height={180} unit="%" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Everything you need to research Zambian markets</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted">From a stock&apos;s first SENS to a 15-year bond auction, in one place.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <Link key={f.t} href={f.h} className="card p-6 transition hover:-translate-y-0.5 hover:border-brand/40">
              <div className="text-lg font-semibold">{f.t}</div>
              <p className="mt-2 text-sm text-muted">{f.d}</p>
              <div className="mt-4 text-sm text-brand">Explore →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 md:grid-cols-4">
          {[["1. Build", "Pick a template or combine indicators with AND/OR rules."], ["2. Backtest", "Run it over LuSE history with fees, stops and position sizing."], ["3. Refine", "Compare CAGR, drawdown and win rate against buy-and-hold and T-bills."], ["4. Deploy", "Turn it into a scan or an alert and log every trade in your journal."]].map(([t, d]) => (
            <div key={t}><div className="text-xl font-bold text-brand">{t}</div><p className="mt-2 text-sm text-muted">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16">
        <h2 className="mb-8 text-3xl font-bold">All tools</h2>
        <div className="grid gap-8 md:grid-cols-4">
          {PRODUCTS.map((g) => (
            <div key={g.label}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">{g.label}</div>
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} className="block border-b border-line/50 py-2 hover:text-brand">
                  <div className="text-sm font-medium">{i.label}</div>
                  <div className="text-xs text-muted">{i.desc}</div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-8">
        <div className="card grid items-center gap-6 p-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl font-bold">Simple pricing in Kwacha</h2>
            <p className="mt-1 text-muted">
              {PLAN_ORDER.map((p) => `${PLANS[p].label}: ${PLANS[p].priceZmw ? `K${PLANS[p].priceZmw}/month` : "free"}`).join(" · ")}. Pay with Airtel Money or MTN MoMo.
            </p>
          </div>
          <Link href="/pricing" className="btn btn-primary px-6 py-3">See plans</Link>
        </div>
      </section>
    </div>
  );
}
