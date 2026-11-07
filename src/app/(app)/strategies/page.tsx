import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate, pct } from "@/lib/format";

export const metadata = { title: "My Strategies" };
export default async function Page() {
  const u = await requireUser("/strategies");
  const [strats, runs] = await Promise.all([
    prisma.strategy.findMany({ where: { userId: u.id }, orderBy: { updatedAt: "desc" } }),
    prisma.backtestRun.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return (
    <div>
      <PageHeader title="My Strategies" subtitle="Saved strategies and your recent backtest runs." />
      <Card title="Saved strategies">
        {strats.length ? <table className="data"><thead><tr><th>Name</th><th>Type</th><th>Symbols</th><th>Saved</th><th></th></tr></thead><tbody>
          {strats.map((s) => { const c = s.config as { symbols?: string[] }; return <tr key={s.id}><td className="font-medium">{s.name}</td><td>{s.kind}</td><td>{c.symbols?.join(", ")}</td><td>{fmtDate(s.updatedAt)}</td><td><Link className="text-brand" href={s.kind === "advanced" ? `/backtester/advanced?strategy=${s.id}` : `/backtester?strategy=${s.id}`}>Open</Link></td></tr>; })}
        </tbody></table> : <Empty>No saved strategies yet. Build one in the <Link href="/backtester" className="text-brand">backtester</Link>.</Empty>}
      </Card>
      <Card title="Recent runs" className="mt-4">
        {runs.length ? <table className="data"><thead><tr><th>Date</th><th>Type</th><th>Symbols</th><th className="r">Return</th><th className="r">Max DD</th><th className="r">Trades</th><th></th></tr></thead><tbody>
          {runs.map((r) => { const m = (r.summary as { metrics: Record<string, number | null> }).metrics; const c = r.config as { symbols: string[] }; return <tr key={r.id}><td>{fmtDate(r.createdAt)}</td><td>{r.kind}</td><td className="max-w-[200px] truncate">{c.symbols.join(", ")}</td><td className="r">{pct(m.totalReturn)}</td><td className="r">{pct(m.maxDrawdown)}</td><td className="r">{m.trades}</td><td><Link className="text-brand" href={`/backtester/runs/${r.shareId}`}>View</Link></td></tr>; })}
        </tbody></table> : <Empty>No runs yet.</Empty>}
      </Card>
    </div>
  );
}
