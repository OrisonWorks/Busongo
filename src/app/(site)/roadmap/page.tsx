import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { WEB3_ENABLED } from "@/config/features";
import { toggleVote } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Roadmap", description: "Vote on what Busongo builds next." };

const STATUS: Record<string, { label: string; color: "slate" | "green" | "blue" }> = { open: { label: "Open for votes", color: "slate" }, planned: { label: "Planned", color: "blue" }, building: { label: "Building", color: "blue" }, done: { label: "Shipped", color: "green" } };

export default async function Page() {
  const user = await getUser();
  const [items, mine, tally] = await Promise.all([
    prisma.roadmapItem.findMany({ include: { _count: { select: { votes: true } } } }),
    user ? prisma.roadmapVote.findMany({ where: { userId: user.id }, select: { itemId: true } }) : [],
    WEB3_ENABLED ? prisma.proof.findFirst({ where: { kind: "roadmap-tally" }, orderBy: { createdAt: "desc" }, select: { hash: true, createdAt: true, txHash: true } }) : null,
  ]);
  const voted = new Set(mine.map((v) => v.itemId));
  const order = ["building", "planned", "open", "done"];
  items.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || b._count.votes - a._count.votes || a.title.localeCompare(b.title));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="Roadmap" subtitle="Vote for the features you want next. One vote per feature per account; you can take a vote back while voting is open." />
      {WEB3_ENABLED && <p className="-mt-2 mb-4 text-sm text-muted">Vote totals are recorded on the Busongo Ledger every day so they can&apos;t be quietly changed.{tally && <> Latest record: <Link className="text-brand" href={`/verify/${tally.hash}`}>{fmtDate(tally.createdAt)}{tally.txHash ? " ✓" : ""}</Link>.</>}</p>}
      <Card>
        {items.length ? <ul className="divide-y divide-border">
          {items.map((i) => {
            const s = STATUS[i.status] ?? STATUS.open;
            const has = voted.has(i.id);
            return <li key={i.id} className="flex items-start gap-4 py-4">
              <div className="w-16 shrink-0 text-center">
                <div className="text-2xl font-bold">{i._count.votes}</div>
                <div className="text-xs text-muted">vote{i._count.votes === 1 ? "" : "s"}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{i.title}</span><Badge color={s.color}>{s.label}</Badge></div>
                <p className="mt-1 text-sm text-muted">{i.description}</p>
              </div>
              {i.status === "open" && (user
                ? <form action={toggleVote.bind(null, i.id)}><button className={has ? "btn btn-primary" : "btn btn-ghost"}>{has ? "Voted ✓" : "Vote"}</button></form>
                : <Link href="/login?next=/roadmap" className="btn btn-ghost">Sign in to vote</Link>)}
            </li>;
          })}
        </ul> : <Empty>No roadmap items yet.</Empty>}
      </Card>
    </div>
  );
}
