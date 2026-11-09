import Link from "next/link";
import { breadth, getAnnouncements, getIndex, getQuotes, latestMacro } from "@/lib/market";
import { prisma } from "@/lib/db";
import MarketTabs from "@/components/MarketTabs";
import { Card, Chg, PageHeader, Stat } from "@/components/ui";
import BriefCard from "@/components/BriefCard";
import { compact, fmt, fmtDate, kwacha } from "@/lib/format";
import { LineChartBox } from "@/components/charts/LineChartBox";
import QuoteTable from "@/components/QuoteTable";
import DataNotice from "@/components/DataNotice";
import PlainBox from "@/components/PlainBox";
import Glossed from "@/components/Glossed";

export const metadata = { title: "Market Terminal" };
export const revalidate = 300;

export default async function Page() {
  const [q, lasi, macro, sens, summary] = await Promise.all([getQuotes(), getIndex("LASI"), latestMacro(), getAnnouncements(8), prisma.marketSummary.findFirst({ orderBy: { date: "desc" } })]);
  const l = lasi.at(-1);
  const b = breadth(q);
  const traded = q.filter((x) => x.changePct != null);
  const gainers = [...traded].sort((a, b) => b.changePct! - a.changePct!).filter((x) => x.changePct! > 0).slice(0, 5);
  const losers = [...traded].sort((a, b) => a.changePct! - b.changePct!).filter((x) => x.changePct! < 0).slice(0, 5);
  const active = [...q].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 5);
  return (
    <div>
      <PageHeader title="Market Terminal" subtitle={`Lusaka Securities Exchange end-of-day data · ${fmtDate(l?.date)}`} />
      <MarketTabs active="/market" />
      <DataNotice need={2} />
      <PlainBox topics={["lasi"]} />
      <BriefCard className="mb-4" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Stat label={<Glossed k="lasi" />} value={fmt(l?.value)} change={l?.pctChange} />
        <Stat label="Value traded" value={kwacha(l?.valueTraded ?? b.value, 0)} sub={`${compact(l?.volume ?? b.volume)} shares`} />
        <Stat label="Trades" value={fmt(l?.trades ?? b.trades, 0)} sub={`${b.traded} counters traded`} />
        <Stat label="Breadth" value={<><span className="text-up">{b.advances}▲</span> <span className="text-down">{b.declines}▼</span> <span className="text-muted">{b.unchanged}■</span></>} />
        <Stat label="Market cap" value={kwacha(l?.marketCap, 0)} sub={l?.marketCapExShoprite ? `ex-Shoprite ${compact(l.marketCapExShoprite)}` : undefined} />
        <Stat label="USD/ZMW" value={fmt(macro.USDZMW?.value, 4)} sub={`BoZ mid · ${fmtDate(macro.USDZMW?.date)}`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="LASI history" className="lg:col-span-2">
          {lasi.length > 1 ? <LineChartBox data={lasi} x="date" lines={[{ key: "value", name: "LASI", color: "#10b981" }]} area height={260} /> : <div className="py-16 text-center text-sm text-muted">LASI {fmt(l?.value)} on {fmtDate(l?.date)}. The chart fills in as daily sessions are stored.</div>}
        </Card>
        <Card title="Market commentary">
          <p className="whitespace-pre-line text-sm text-muted">{summary?.text || "No commentary published for the latest session."}</p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {[["Top gainers", gainers], ["Top losers", losers], ["Most active (value)", active]].map(([t, rows]) => (
          <Card key={t as string} title={t as string}>
            {(rows as typeof q).length ? (rows as typeof q).map((r) => (
              <Link key={r.symbol} href={`/stocks/${r.symbol}`} className="flex justify-between border-b border-line/50 py-1.5 text-sm last:border-0 hover:text-brand">
                <span className="font-medium">{r.symbol}</span>
                <span className="num">{kwacha(r.close)} <Chg v={r.changePct} /></span>
              </Link>
            )) : <p className="text-sm text-muted">None in the latest session.</p>}
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="All securities" className="lg:col-span-2"><QuoteTable rows={q} showSector={false} /></Card>
        <Card title="Latest SENS" action={<Link href="/sens" className="text-xs text-brand">All →</Link>}>
          {sens.map((s) => (
            <a key={s.id} href={s.url ?? "#"} target="_blank" rel="noreferrer" className="block border-b border-line/50 py-2 text-sm last:border-0 hover:text-brand">
              <div>{s.title}</div>
              <div className="text-xs text-muted">{s.security?.symbol ?? "LuSE"} · {fmtDate(s.date)}</div>
            </a>
          ))}
        </Card>
      </div>
    </div>
  );
}
