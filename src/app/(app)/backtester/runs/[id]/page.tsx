import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { describeCond, type Cond } from "@/lib/engine/series";
import { fmt, fmtDate, pct } from "@/lib/format";

export const metadata = { title: "Backtest result" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const r = await prisma.backtestRun.findUnique({ where: { shareId: (await params).id } });
  if (!r) notFound();
  const c = r.config as { symbols: string[]; entry: Cond[]; exit: Cond[]; entryJoin?: string; exitJoin?: string; capital: number; feeRate: number };
  const proof = await prisma.proof.findFirst({ where: { kind: "backtest", refId: r.id }, select: { hash: true, txHash: true } });
  const m = (r.summary as { metrics: Record<string, number | null> }).metrics;
  return (
    <div>
      <PageHeader title={`Backtest · ${c.symbols.join(", ")}`} subtitle={`${r.kind} backtest run on ${fmtDate(r.createdAt)}`}>
        {proof && <Link href={`/verify/${proof.hash}`} className="btn btn-ghost">{proof.txHash ? "Verified on NEAR ✓" : "Fingerprinted ✓"}</Link>}
        <Link href="/backtester/advanced" className="btn btn-primary">Build your own</Link>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Rules">
          <div className="text-sm"><b className="text-up">Entry</b> ({c.entryJoin || "AND"}): {c.entry.map(describeCond).join(" · ")}</div>
          <div className="mt-2 text-sm"><b className="text-down">Exit</b> ({c.exitJoin || "AND"}): {c.exit.map(describeCond).join(" · ") || "stops only"}</div>
          <div className="mt-2 text-xs text-muted">Capital K{fmt(c.capital, 0)} · fees {(c.feeRate * 100).toFixed(3)}% per side</div>
        </Card>
        <Card title="Results">
          <table className="data"><tbody>
            {[["Total return", pct(m.totalReturn)], ["CAGR", pct(m.cagr)], ["Max drawdown", pct(m.maxDrawdown)], ["Trades", fmt(m.trades, 0)], ["Win rate", m.winRate == null ? "—" : m.winRate.toFixed(1) + "%"], ["Profit factor", fmt(m.profitFactor)], ["Buy & hold", pct(m.benchmarkReturn)]].map(([k, v]) => <tr key={k}><td>{k}</td><td className="num r">{v}</td></tr>)}
          </tbody></table>
        </Card>
      </div>
    </div>
  );
}
