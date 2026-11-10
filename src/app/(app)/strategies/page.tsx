import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate, pct } from "@/lib/format";
import { proveBacktest, proveStrategy } from "../proofs/actions";
import { anchoringEnabled } from "@/lib/web3/near";
import { WEB3_ENABLED } from "@/config/features";

export const metadata = { title: "My Strategies" };
export default async function Page() {
  const u = await requireUser("/strategies");
  const [strats, runs] = await Promise.all([
    prisma.strategy.findMany({ where: { userId: u.id }, orderBy: { updatedAt: "desc" } }),
    prisma.backtestRun.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const proofs = new Map((await prisma.proof.findMany({ where: { userId: u.id }, orderBy: { createdAt: "asc" }, select: { refId: true, hash: true, txHash: true } })).map((p) => [p.refId, p]));
  const onChain = anchoringEnabled();
  const Prove = ({ id, act }: { id: string; act: (id: string) => Promise<void> }) => {
    if (!WEB3_ENABLED) return null;
    const p = proofs.get(id);
    if (p && (p.txHash || !onChain)) return <Link className="ml-3 text-up" href={`/verify/${p.hash}`}>{p.txHash ? "Verified ✓" : "Fingerprinted ✓"}</Link>;
    return <form action={act.bind(null, id)} className="ml-3 inline"><button className="text-brand" title="Record a SHA-256 fingerprint on the Busongo Ledger so this can never be edited silently">{p ? "Retry recording" : "Record on ledger"}</button></form>;
  };
  return (
    <div>
      <PageHeader title="My Strategies" subtitle={WEB3_ENABLED ? "Trading rules you saved and their test runs on old prices. Record one on the Busongo Ledger to lock in a public, tamper-evident fingerprint of it." : "Trading rules you saved and their test runs on old prices."} />
      <Card title="Saved strategies">
        {strats.length ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Name</th><th>Type</th><th>Symbols</th><th>Saved</th><th></th></tr></thead><tbody>
          {strats.map((s) => { const c = s.config as { symbols?: string[] }; return <tr key={s.id}><td className="font-medium">{s.name}</td><td>{s.kind}</td><td>{c.symbols?.join(", ")}</td><td>{fmtDate(s.updatedAt)}</td><td><Link className="text-brand" href={s.kind === "advanced" ? `/backtester/advanced?strategy=${s.id}` : `/backtester?strategy=${s.id}`}>Open</Link><Prove id={s.id} act={proveStrategy} /></td></tr>; })}
        </tbody></table></div> : <Empty>No saved strategies yet. Build one in the <Link href="/backtester" className="text-brand">backtester</Link>.</Empty>}
      </Card>
      <Card title="Recent runs" className="mt-4">
        {runs.length ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Date</th><th>Type</th><th>Symbols</th><th className="r">Return</th><th className="r">Max DD</th><th className="r">Trades</th><th></th></tr></thead><tbody>
          {runs.map((r) => { const m = (r.summary as { metrics: Record<string, number | null> }).metrics; const c = r.config as { symbols: string[] }; return <tr key={r.id}><td>{fmtDate(r.createdAt)}</td><td>{r.kind}</td><td className="max-w-[200px] truncate">{c.symbols.join(", ")}</td><td className="r">{pct(m.totalReturn)}</td><td className="r">{pct(m.maxDrawdown)}</td><td className="r">{m.trades}</td><td><Link className="text-brand" href={`/backtester/runs/${r.shareId}`}>View</Link><Prove id={r.id} act={proveBacktest} /></td></tr>; })}
        </tbody></table></div> : <Empty>No runs yet.</Empty>}
      </Card>
    </div>
  );
}
