import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate, pct } from "@/lib/format";
import { handleLabel, normalizeHandle } from "@/lib/handles";
import { WEB3_ENABLED } from "@/config/features";

export const dynamic = "force-dynamic";

const findProfile = (handle: string) => prisma.user.findFirst({ where: { handle: normalizeHandle(decodeURIComponent(handle)), profilePublic: true }, select: { id: true, name: true, handle: true, bio: true, nearAccountId: true, createdAt: true } });

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const u = await findProfile((await params).handle);
  return { title: u?.handle ? handleLabel(u.handle) : "Profile" };
}

type Payload = { name?: string; engine?: string; config?: { symbols?: string[] }; summary?: { metrics?: { totalReturn?: number | null; maxDrawdown?: number | null; trades?: number | null } } };

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const u = await findProfile((await params).handle);
  if (!u?.handle) notFound();
  const records = WEB3_ENABLED ? await prisma.proof.findMany({ where: { userId: u.id, kind: { in: ["strategy", "backtest"] } }, orderBy: { createdAt: "desc" }, take: 50 }) : [];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title={u.name || handleLabel(u.handle)} subtitle={`${handleLabel(u.handle)} · member since ${fmtDate(u.createdAt)}`}>
        {WEB3_ENABLED && u.nearAccountId && <Badge color="green">Verified wallet</Badge>}
      </PageHeader>
      {u.bio && <p className="-mt-2 mb-6 whitespace-pre-line text-sm text-muted">{u.bio}</p>}
      {WEB3_ENABLED && (
        <Card title="Ledger records">
          {records.length ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Recorded</th><th>Type</th><th>Strategy / symbols</th><th className="r">Return</th><th className="r">Max DD</th><th className="r">Trades</th><th></th></tr></thead><tbody>
            {records.map((r) => {
              const p = r.payload as Payload; const m = p.summary?.metrics;
              return <tr key={r.id}><td>{fmtDate(r.createdAt)}</td><td>{r.kind}</td><td className="max-w-[240px] truncate">{p.name ?? p.config?.symbols?.join(", ")}</td><td className="r">{m ? pct(m.totalReturn ?? null) : "—"}</td><td className="r">{m ? pct(m.maxDrawdown ?? null) : "—"}</td><td className="r">{m?.trades ?? "—"}</td><td><Link className="text-brand" href={`/verify/${r.hash}`}>{r.txHash ? "Verified ✓" : "Fingerprint"}</Link></td></tr>;
            })}
          </tbody></table></div> : <Empty>No ledger records yet.</Empty>}
          <p className="mt-3 text-xs text-muted">Each record is a fingerprint fixed on the Busongo Ledger when it was made, so results can&apos;t be edited afterwards. Backtests are historical simulations, not a promise of future returns.</p>
        </Card>
      )}
    </div>
  );
}
