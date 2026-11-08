import Link from "next/link";
import { prisma } from "@/lib/db";
import { getMacro, getQuotes, latestMacro } from "@/lib/market";
import { yieldCurve } from "@/lib/fixed-income";
import { WHT_DEFAULT } from "@/lib/fi";
import { afterTax, P2P_BUY, P2P_SELL, p2pPremium, realReturn, zmwReturnFromUsd } from "@/lib/crypto-zm";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { fmt, fmtDate, pct, tone } from "@/lib/format";

export const metadata = { title: "Kwacha & Stablecoins", description: "Crypto prices in ZMW, the USDT/ZMW P2P premium over the BoZ rate, and stablecoin yields compared with GRZ T-bills after tax and inflation." };
export const revalidate = 600;

export default async function Page({ searchParams }: { searchParams: Promise<{ fx?: string }> }) {
  const sp = await searchParams;
  const [m, buyH, sellH, offH, curve, q, lastY] = await Promise.all([latestMacro(), getMacro(P2P_BUY), getMacro(P2P_SELL), getMacro("USDZMW"), yieldCurve(), getQuotes("CRYPTO"), prisma.stableYield.findFirst({ orderBy: { date: "desc" } })]);
  const pools = lastY ? await prisma.stableYield.findMany({ where: { date: lastY.date }, orderBy: { tvlUsd: "desc" }, take: 15 }) : [];
  const off = m.USDZMW?.value ?? null;
  const buy = m[P2P_BUY]?.value ?? null, sell = m[P2P_SELL]?.value ?? null;
  const mid = buy && sell ? (buy + sell) / 2 : buy ?? sell;
  const prem = mid && off ? p2pPremium(mid, off) : null;
  const offAt = (d: string) => { let v: number | null = null; for (const o of offH) { if (o.date <= d) v = o.value; else break; } return v; };
  const sellAt = new Map(sellH.map((s) => [s.date, s.value]));
  const hist = buyH.map((b) => { const o = offAt(b.date); const s = sellAt.get(b.date); const md = s ? (b.value + s) / 2 : b.value; return { date: b.date, premium: o ? +p2pPremium(md, o).toFixed(2) : null }; }).filter((x) => x.premium != null);
  const first = offH[0], lastOff = offH[offH.length - 1];
  const spanDays = first && lastOff ? (Date.parse(lastOff.date) - Date.parse(first.date)) / 86400000 : 0;
  const fullYear = spanDays >= 365;
  const base = fullYear ? offAt(new Date(Date.parse(lastOff.date) - 365 * 86400000).toISOString().slice(0, 10)) : first?.value ?? null;
  const fxHist = off && base && spanDays >= 30 ? ((off / base) ** (fullYear ? 1 : 365 / spanDays) - 1) * 100 : 0;
  const fxLabel = spanDays < 30 ? "Not enough BoZ exchange-rate history yet, so 0% is assumed." : `${fullYear ? "Last 12 months" : `Since ${fmtDate(first.date)}, annualised`}: ${pct(fxHist)} (${fxHist < 0 ? "kwacha strengthened" : "kwacha weakened"}).`;
  const fx = sp.fx != null && sp.fx !== "" && Number.isFinite(+sp.fx) ? Math.max(-90, Math.min(500, +sp.fx)) : fxHist;
  const infl = m.INFLATION?.value ?? 0;
  const tb = curve.find((c) => c.tenor === "364d")?.yield ?? null;
  type Row = { name: string; sub: string; ccy: string; gross: number; net: number; zmw: number; tvl?: number };
  const rows: Row[] = [];
  if (tb != null) rows.push({ name: "GRZ 364-day T-bill", sub: `after ${WHT_DEFAULT}% withholding tax`, ccy: "ZMW", gross: tb, net: afterTax(tb, WHT_DEFAULT), zmw: afterTax(tb, WHT_DEFAULT) });
  rows.push({ name: "Hold USDT (no yield)", sub: "kwacha move only", ccy: "USD", gross: 0, net: 0, zmw: zmwReturnFromUsd(0, fx) });
  for (const p of pools) rows.push({ name: `${p.project} · ${p.symbol}`, sub: p.chain, ccy: "USD", gross: p.apy, net: p.apy, zmw: zmwReturnFromUsd(p.apy, fx), tvl: p.tvlUsd });
  return (
    <div>
      <PageHeader title="Kwacha & Stablecoins" subtitle="What crypto and dollar stablecoins are worth in kwacha, how far the street USDT rate sits from the Bank of Zambia rate, and how stablecoin yields compare with GRZ T-bills." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="BoZ USD/ZMW" value={off ? `K${fmt(off, 4)}` : "—"} sub={fmtDate(m.USDZMW?.date)} />
        <Stat label="P2P: buy USDT" value={buy ? `K${fmt(buy)}` : "—"} sub="what you pay (Binance P2P)" />
        <Stat label="P2P: sell USDT" value={sell ? `K${fmt(sell)}` : "—"} sub="what you receive" />
        <Stat label="P2P premium" value={prem != null ? pct(prem) : "—"} sub={m[P2P_BUY] ? `mid vs BoZ · ${fmtDate(m[P2P_BUY]!.date)}` : "no snapshot yet"} />
      </div>
      <Card title="USDT/ZMW P2P premium over the official rate" className="mt-4">
        {hist.length > 1 ? <LineChartBox data={hist} x="date" lines={[{ key: "premium", name: "Premium %", color: "#f59e0b" }]} unit="%" height={220} /> : <Empty>History builds from daily snapshots. {hist.length === 1 ? `Today's premium is ${pct(hist[0].premium)}.` : "No snapshot stored yet."}</Empty>}
        <p className="mt-2 text-xs text-muted">A positive premium means USDT costs more on the street than the official dollar rate, a sign of demand for dollars that the official market isn&apos;t meeting. The median of the 10 best Binance P2P ads on each side is recorded once a day.</p>
      </Card>
      <Card title="Stablecoin yields vs GRZ T-bills, in kwacha terms" className="mt-4">
        <form className="mb-3 flex flex-wrap items-end gap-2 text-sm">
          <div><label className="label" htmlFor="fx">Assumed USD/ZMW change over 12 months (%)</label><input id="fx" name="fx" type="number" step="0.1" defaultValue={fx.toFixed(1)} className="input w-40" /></div>
          <button className="btn btn-ghost">Recalculate</button>
          <span className="text-xs text-muted">{fxLabel} Positive = kwacha weakens, which helps dollar assets.</span>
        </form>
        {rows.length ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Option</th><th>Currency</th><th className="r">Yield</th><th className="r">Net yield</th><th className="r">Return in ZMW</th><th className="r">Real (after {fmt(infl, 1)}% inflation)</th><th className="r">TVL</th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.name + r.sub}><td>{r.name}<div className="text-[11px] text-muted">{r.sub}</div></td><td>{r.ccy}</td><td className="r">{fmt(r.gross)}%</td><td className="r">{fmt(r.net)}%</td><td className={`r ${tone(r.zmw)}`}>{pct(r.zmw)}</td><td className={`r ${tone(realReturn(r.zmw, infl))}`}>{pct(realReturn(r.zmw, infl))}</td><td className="r">{r.tvl ? `$${fmt(r.tvl / 1e6, 0)}M` : "—"}</td></tr>)}
        </tbody></table></div> : <Empty>No yield data yet.</Empty>}
        <p className="mt-3 text-xs text-muted">Stablecoin yields: DefiLlama, single-asset lending/savings pools over $50M TVL{lastY ? `, ${fmtDate(lastY.date)}` : ""}. They carry smart-contract, de-peg, platform and exchange-rate risk that GRZ securities do not, and their tax treatment in Zambia is not settled. Check the current SEC Zambia and Bank of Zambia position on virtual assets before you invest. This is not investment advice.</p>
      </Card>
      <Card title="Crypto prices in kwacha" className="mt-4">
        {q.length && off ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Coin</th><th className="r">USDT</th><th className="r">ZMW (BoZ rate)</th><th className="r">ZMW (P2P rate)</th><th className="r">24h</th></tr></thead><tbody>
          {q.map((x) => <tr key={x.symbol}><td><Link className="text-brand" href={`/crypto/${x.symbol}`}>{x.symbol}</Link> <span className="text-xs text-muted">{x.name}</span></td><td className="r">{fmt(x.close)}</td><td className="r">K{fmt((x.close ?? 0) * off)}</td><td className="r">{buy ? `K${fmt((x.close ?? 0) * buy)}` : "—"}</td><td className={`r ${tone(x.changePct)}`}>{pct(x.changePct)}</td></tr>)}
        </tbody></table></div> : <Empty>No crypto prices or exchange rate stored yet.</Empty>}
      </Card>
    </div>
  );
}
