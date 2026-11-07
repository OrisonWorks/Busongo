import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAnnouncements, getBars, getIndex, getSecurity, latestMacro } from "@/lib/market";
import { getUser } from "@/lib/auth";
import { Badge, Card, Chg, PageHeader, Stat } from "@/components/ui";
import PriceChart from "@/components/charts/PriceChart";
import WatchButton from "@/components/WatchButton";
import AlertForm from "@/components/AlertForm";
import { ccy, compact, fmt, fmtDate, fmtInt } from "@/lib/format";
import { Series } from "@/lib/engine/series";
import { pivots } from "@/lib/indicators";
import { valuation } from "@/lib/fundamentals";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const s = await getSecurity((await params).symbol);
  return s ? { title: `${s.symbol} — ${s.name} share price`, description: `${s.name} (${s.symbol}) price, chart, fundamentals and announcements.` } : {};
}

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sec = await getSecurity(symbol);
  if (!sec) notFound();
  const [bars, user, sens, funds, actions, lasi] = await Promise.all([
    getBars(sec.symbol),
    getUser(),
    getAnnouncements(15, sec.symbol),
    prisma.fundamental.findMany({ where: { securityId: sec.id, period: "FY" }, orderBy: { fiscalYear: "desc" } }),
    prisma.corporateAction.findMany({ where: { securityId: sec.id }, orderBy: { exDate: "desc" }, take: 10 }),
    getIndex("LASI"),
  ]);
  const fx = sec.assetClass === "CRYPTO" ? await latestMacro() : null;
  const watching = user ? !!(await prisma.watchItem.findUnique({ where: { userId_symbol: { userId: user.id, symbol: sec.symbol } } })) : false;
  const crypto = sec.assetClass === "CRYPTO";
  const last = bars.at(-1), prev = bars.at(-2);
  const s = new Series(bars);
  const i = bars.length - 1;
  const at = (o: Parameters<Series["get"]>[0]) => (i >= 0 ? s.get(o)[i] : null);
  const yr = bars.slice(-252);
  const hi52 = yr.length ? Math.max(...yr.map((b) => b.close)) : null, lo52 = yr.length ? Math.min(...yr.map((b) => b.close)) : null;
  const ret = (n: number) => (bars.length > n ? (last!.close / bars[bars.length - 1 - n].close - 1) * 100 : null);
  const v = valuation(funds[0], last?.close ?? null, sec.sharesOutstanding);
  const pv = last ? pivots(last.high, last.low, last.close) : null;
  const sma = (n: number) => bars.map((b, k) => ({ date: b.date, value: s.get({ ind: "sma", period: n })[k] }));
  const raw = last ? await prisma.priceBar.findFirst({ where: { securityId: sec.id }, orderBy: { date: "desc" } }) : null;
  const tech = [
    ["RSI(14)", at({ ind: "rsi", period: 14 })], ["SMA(20)", at({ ind: "sma", period: 20 })], ["SMA(50)", at({ ind: "sma", period: 50 })], ["SMA(200)", at({ ind: "sma", period: 200 })],
    ["MACD", at({ ind: "macd" })], ["ADX(14)", at({ ind: "adx", period: 14 })], ["ATR(14)", at({ ind: "atr", period: 14 })], ["Supertrend", at({ ind: "supertrend", period: 10 })],
  ] as const;
  const base = crypto ? "/crypto" : "/stocks";
  return (
    <div>
      <PageHeader
        crumbs={[{ href: base, label: crypto ? "Crypto" : "Stocks" }]}
        title={`${sec.symbol} · ${sec.name}`}
        subtitle={<span className="flex flex-wrap gap-2">{sec.sector && <Badge>{sec.sector}</Badge>}{sec.board && !crypto && <Badge color="blue">{sec.board} Board</Badge>}{sec.isin && <Badge>{sec.isin}</Badge>}<Badge color="amber">{sec.currency}</Badge></span>}
      >
        <WatchButton symbol={sec.symbol} initial={watching} signedIn={!!user} />
        <Link href={`/backtester?symbol=${sec.symbol}`} className="btn btn-primary">Backtest {sec.symbol}</Link>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={`Close · ${fmtDate(last?.date)}`} value={ccy(sec.currency, last?.close)} change={last && prev ? (last.close / prev.close - 1) * 100 : raw?.change != null && last ? (raw.change / (last.close - raw.change)) * 100 : null} />
        <Stat label="Volume" value={compact(last?.volume)} sub={`${fmtInt(last?.trades)} trades`} />
        <Stat label="Value traded" value={ccy(sec.currency, last?.value, 0)} />
        <Stat label="52-week range" value={`${fmt(lo52)} – ${fmt(hi52)}`} sub={`${bars.length} sessions stored`} />
        <Stat label="Best bid / ask" value={`${raw?.bidPrice ?? "—"} / ${raw?.askPrice ?? "—"}`} sub={raw?.bidQty || raw?.askQty ? `${compact(raw?.bidQty)} / ${compact(raw?.askQty)}` : undefined} />
        {fx ? <Stat label="Price in kwacha" value={fx.USDZMW && last ? `K${fmt(last.close * fx.USDZMW.value)}` : "—"} sub={fx.P2P_USDT_ZMW_BUY && last ? `P2P: K${fmt(last.close * fx.P2P_USDT_ZMW_BUY.value)} · BoZ K${fmt(fx.USDZMW?.value, 2)}/$` : `BoZ K${fmt(fx.USDZMW?.value, 2)}/$`} /> : null}
        {!fx && <Stat label="P/E · Div. yield" value={`${fmt(v.pe, 1)} · ${fmt(v.divYield, 1)}%`} sub={funds[0] ? `FY${funds[0].fiscalYear}` : "No filings loaded"} />}
      </div>
      <Card className="mt-4" title="Price chart" action={<span className="text-xs text-muted">{crypto ? "Daily OHLC" : "Close-to-close candles"} · SMA 20 / 50</span>}>
        {bars.length > 1 ? <PriceChart bars={bars} overlays={[{ name: "SMA20", color: "#38bdf8", data: sma(20) }, { name: "SMA50", color: "#f59e0b", data: sma(50) }]} /> : <div className="py-20 text-center text-sm text-muted">Only {bars.length} session stored so far. The chart fills in as daily data accumulates.</div>}
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Returns">
          <table className="data"><tbody>
            {[["1 week", 5], ["1 month", 21], ["3 months", 63], ["6 months", 126], ["1 year", 252], ["3 years", 756]].map(([l, n]) => <tr key={l}><td>{l}</td><td className="r"><Chg v={ret(n as number)} /></td></tr>)}
            {!crypto && lasi.length > 1 && <tr><td className="text-muted">LASI (all stored)</td><td className="r"><Chg v={(lasi.at(-1)!.value / lasi[0].value - 1) * 100} /></td></tr>}
          </tbody></table>
        </Card>
        <Card title="Technicals">
          <table className="data"><tbody>{tech.map(([l, x]) => <tr key={l}><td>{l}</td><td className="num r">{fmt(x)}</td></tr>)}</tbody></table>
        </Card>
        <Card title="Pivot levels (last session)">
          {pv ? <table className="data"><tbody>{(["r3", "r2", "r1", "p", "s1", "s2", "s3"] as const).map((k) => <tr key={k}><td className="uppercase">{k}</td><td className="num r">{fmt(pv[k])}</td></tr>)}</tbody></table> : <p className="text-sm text-muted">No data</p>}
        </Card>
      </div>
      {!crypto && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Fundamentals" action={<Link href={`/fundamentals/${sec.symbol}`} className="text-xs text-brand">Details →</Link>}>
            {funds.length ? (
              <table className="data"><thead><tr><th>Year</th><th className="r">Revenue</th><th className="r">Net income</th><th className="r">EPS</th><th className="r">DPS</th></tr></thead>
                <tbody>{funds.slice(0, 5).map((f) => <tr key={f.id}><td>FY{f.fiscalYear}</td><td className="num r">{compact(f.revenue)}</td><td className="num r">{compact(f.netIncome)}</td><td className="num r">{fmt(f.eps)}</td><td className="num r">{fmt(f.dps)}</td></tr>)}</tbody></table>
            ) : <p className="text-sm text-muted">No financial statements loaded yet for {sec.symbol}. Results are published in SENS announcements below.</p>}
            {sec.description && <p className="mt-3 text-sm text-muted">{sec.description}</p>}
          </Card>
          <Card title="SENS announcements">
            {sens.length ? sens.map((a) => <a key={a.id} href={a.url ?? "#"} target="_blank" rel="noreferrer" className="block border-b border-line/50 py-2 text-sm last:border-0 hover:text-brand">{a.title}<div className="text-xs text-muted">{a.category} · {fmtDate(a.date)}</div>{a.summary && <div className="mt-1 whitespace-pre-line text-xs text-muted">{a.summary}</div>}</a>) : <p className="text-sm text-muted">No announcements stored.</p>}
            {actions.length > 0 && <div className="mt-3 text-sm"><div className="mb-1 font-semibold">Corporate actions</div>{actions.map((a) => <div key={a.id} className="text-muted">{a.type} {a.amount ? `K${a.amount}` : ""} · ex {fmtDate(a.exDate)}</div>)}</div>}
          </Card>
        </div>
      )}
      <Card title="Set an alert" className="mt-4">
        {user ? <AlertForm symbols={[sec.symbol]} defaultSymbol={sec.symbol} /> : <Link href={`/login?next=${base}/${sec.symbol}`} className="text-sm text-brand">Sign in to create alerts</Link>}
      </Card>
    </div>
  );
}
