import { prisma } from "@/lib/db";
import { Card, Empty, PageHeader, Tabs } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Calendars" };
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "holidays" } = await searchParams;
  const now = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const [hol, acts, tb, bd, sens] = await Promise.all([
    prisma.tradingHoliday.findMany({ where: { date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.corporateAction.findMany({ include: { security: true }, orderBy: { exDate: "desc" }, take: 100 }),
    prisma.tbillAuction.findMany({ distinct: ["auctionDate"], orderBy: { auctionDate: "desc" }, take: 30 }),
    prisma.bondAuction.findMany({ distinct: ["auctionDate"], orderBy: { auctionDate: "desc" }, take: 30 }),
    prisma.announcement.findMany({ where: { category: "Financial Results" }, include: { security: true }, orderBy: { date: "desc" }, take: 100 }),
  ]);
  const tabs = [{ href: "/calendar?tab=holidays", label: "LuSE holidays" }, { href: "/calendar?tab=auctions", label: "BoZ auctions" }, { href: "/calendar?tab=results", label: "Results" }, { href: "/calendar?tab=dividends", label: "Dividends & actions" }];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <PageHeader title="Calendars" subtitle="Market holidays, auction dates, results and corporate actions." />
      <Tabs items={tabs} active={`/calendar?tab=${tab}`} />
      <Card>
        {tab === "holidays" && <table className="data"><thead><tr><th>Date</th><th>Day</th><th>Holiday (market closed)</th></tr></thead><tbody>{hol.map((h) => <tr key={h.id} className={h.date.toISOString().slice(0, 10) < today ? "opacity-50" : ""}><td>{fmtDate(h.date)}</td><td>{h.date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })}</td><td>{h.name}</td></tr>)}</tbody></table>}
        {tab === "auctions" && <div className="grid gap-6 md:grid-cols-2"><div><div className="mb-2 font-semibold">T-bill auctions</div><table className="data"><tbody>{tb.map((x) => <tr key={x.id}><td>{fmtDate(x.auctionDate)}</td><td className="text-muted">{x.tenderNo}</td></tr>)}</tbody></table></div><div><div className="mb-2 font-semibold">Bond auctions</div><table className="data"><tbody>{bd.map((x) => <tr key={x.id}><td>{fmtDate(x.auctionDate)}</td><td className="text-muted">{x.tenderNo}</td></tr>)}</tbody></table></div><p className="text-xs text-muted md:col-span-2">BoZ T-bill auctions run fortnightly; the next date is typically two weeks after the latest one shown.</p></div>}
        {tab === "results" && (sens.length ? <table className="data"><tbody>{sens.map((s) => <tr key={s.id}><td>{fmtDate(s.date)}</td><td>{s.security?.symbol ?? "—"}</td><td className="whitespace-normal">{s.title}</td></tr>)}</tbody></table> : <Empty>No results announcements stored yet.</Empty>)}
        {tab === "dividends" && (acts.length ? <table className="data"><thead><tr><th>Symbol</th><th>Type</th><th className="r">Amount</th><th>Ex-date</th><th>Pay date</th><th>Notes</th></tr></thead><tbody>{acts.map((a) => <tr key={a.id}><td>{a.security.symbol}</td><td>{a.type}</td><td className="r">{a.amount ?? "—"}</td><td>{fmtDate(a.exDate)}</td><td>{fmtDate(a.payDate)}</td><td className="text-muted">{a.notes}</td></tr>)}</tbody></table> : <Empty>No corporate actions loaded yet. Admins can add them in the admin panel.</Empty>)}
      </Card>
    </div>
  );
}
