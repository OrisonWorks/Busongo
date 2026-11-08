import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getIndex, getQuotes, latestMacro } from "@/lib/market";
import { yieldCurve } from "@/lib/fixed-income";
import { getUsage } from "@/lib/usage";
import { PLANS } from "@/config/plans";
import BriefCard from "@/components/BriefCard";
import { Card, Chg, PageHeader, Stat } from "@/components/ui";
import { fmt, fmtDate, kwacha, pct } from "@/lib/format";
import { PAYMENTS_ENABLED } from "@/config/features";

export const metadata = { title: "Dashboard" };
export default async function Page() {
  const u = await requireUser("/dashboard");
  const [q, lasi, m, curve, watch, alerts, notes, runs, ai, bt] = await Promise.all([
    getQuotes(), getIndex(), latestMacro(), yieldCurve(),
    prisma.watchItem.findMany({ where: { userId: u.id } }),
    prisma.alert.count({ where: { userId: u.id, active: true } }),
    prisma.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.backtestRun.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    getUsage(u, "aiMessages"), getUsage(u, "advancedBacktests"),
  ]);
  const plan = PLANS[u.effectivePlan];
  const l = lasi.at(-1);
  const w = q.filter((x) => watch.some((y) => y.symbol === x.symbol));
  return (
    <div>
      <PageHeader title={`Welcome${u.name ? `, ${u.name.split(" ")[0]}` : ""}`} subtitle={PAYMENTS_ENABLED ? <>{plan.label} plan{u.planExpiresAt && u.effectivePlan !== "FREE" ? ` · renews by ${fmtDate(u.planExpiresAt)}` : ""} · <Link href="/pricing" className="text-brand">Upgrade</Link></> : "Your markets, strategies and alerts."} />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="LASI" value={fmt(l?.value)} change={l?.pctChange} />
        <Stat label="MPR" value={`${fmt(m.MPR?.value)}%`} />
        <Stat label="Inflation" value={`${fmt(m.INFLATION?.value)}%`} />
        <Stat label="364d T-bill" value={`${fmt(curve.find((c) => c.tenor === "364d")?.yield)}%`} />
        <Stat label="AI messages" value={`${ai.used}/${ai.limit}`} sub="this month" />
        <Stat label="Advanced backtests" value={`${bt.used}/${bt.limit}`} sub={`${alerts}/${plan.alerts} alerts active`} />
      </div>
      <BriefCard className="mt-4" />
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Watchlist" action={<Link href="/watchlist" className="text-xs text-brand">Manage →</Link>}>
          {w.length ? w.map((x) => <Link key={x.symbol} href={`/stocks/${x.symbol}`} className="flex justify-between border-b border-line/50 py-1.5 text-sm last:border-0"><span>{x.symbol}</span><span>{kwacha(x.close)} <Chg v={x.changePct} /></span></Link>) : <p className="text-sm text-muted">Add stocks with ☆ Watch on any stock page.</p>}
        </Card>
        <Card title="Recent backtests" action={<Link href="/strategies" className="text-xs text-brand">All →</Link>}>
          {runs.length ? runs.map((r) => { const mm = (r.summary as { metrics: Record<string, number | null> }).metrics; return <Link key={r.id} href={`/backtester/runs/${r.shareId}`} className="flex justify-between border-b border-line/50 py-1.5 text-sm last:border-0"><span>{(r.config as { symbols: string[] }).symbols.join(", ")}</span><span>{pct(mm.totalReturn)}</span></Link>; }) : <p className="text-sm text-muted">No runs yet. <Link href="/backtester" className="text-brand">Run one</Link>.</p>}
        </Card>
        <Card title="Notifications" action={<Link href="/notifications" className="text-xs text-brand">All →</Link>}>
          {notes.length ? notes.map((n) => <div key={n.id} className="border-b border-line/50 py-1.5 text-sm last:border-0">{n.title}<div className="text-xs text-muted">{fmtDate(n.createdAt)}</div></div>) : <p className="text-sm text-muted">Nothing yet.</p>}
        </Card>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["/scanner", "Run a scan"], ["/backtester/advanced", "Build a strategy"], ["/fixed-income/calculator", "T-bill calculator"], ["/aichat", "Ask the AI"]].map(([h, t]) => <Link key={h} href={h} className="card p-4 text-sm font-medium hover:border-brand/40">{t} →</Link>)}
      </div>
    </div>
  );
}
