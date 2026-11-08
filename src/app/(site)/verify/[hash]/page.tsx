import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { NEAR, accountUrl, readAnchor, txUrl } from "@/lib/web3/near";
import { canonical, proofHash } from "@/lib/web3/proof";
import { WEB3_ENABLED } from "@/config/features";
import { handleLabel, profilePath } from "@/lib/handles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Busongo Ledger record" };
export default async function Page({ params }: { params: Promise<{ hash: string }> }) {
  if (!WEB3_ENABLED) notFound();
  const { hash } = await params;
  if (!/^[0-9a-f]{64}$/.test(hash)) notFound();
  const p = await prisma.proof.findUnique({ where: { hash }, include: { user: { select: { handle: true, profilePublic: true } } } });
  if (!p) notFound();
  const matches = proofHash(p.payload) === p.hash;
  const signer = p.signer ?? NEAR.signer;
  const onChain = p.txHash ? await readAnchor(hash, signer).catch(() => null) : null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="Busongo Ledger record" subtitle={`${p.kind} · recorded ${fmtDate(p.createdAt)}`} />
      {p.user?.profilePublic && p.user.handle && <p className="-mt-2 mb-4 text-sm">Recorded by <Link className="text-brand" href={profilePath(p.user.handle)}>{handleLabel(p.user.handle)}</Link></p>}
      <Card>
        <div className="flex flex-wrap gap-2">
          <Badge color={matches ? "green" : "red"}>{matches ? "Content matches hash" : "Content does not match hash"}</Badge>
          {p.txHash ? <Badge color={onChain ? "green" : "amber"}>{onChain ? "Recorded on the public ledger" : "Sent to the ledger, awaiting confirmation"}</Badge> : <Badge color="amber">Not yet on the public ledger</Badge>}
        </div>
        <div className="mt-3 break-all font-mono text-xs">SHA-256 {p.hash}</div>
        {p.txHash && <div className="mt-2 break-all text-sm">Transaction <a className="text-brand" href={txUrl(p.txHash)} target="_blank" rel="noreferrer">{p.txHash}</a> on {fmtDate(p.anchoredAt!)} · written by <a className="text-brand" href={accountUrl(signer)} target="_blank" rel="noreferrer">{signer}</a> to <code>{NEAR.social}</code> at <code>{signer}/busongo/proofs/{p.hash.slice(0, 10)}…</code></div>}
        <p className="mt-3 text-xs text-muted">To check it yourself: hash the JSON below with SHA-256 and compare it to the hash, then look up the key above on NEAR Social, the public blockchain the Busongo Ledger writes to. The record was fixed when it was written; any later change to the strategy or results gives a different hash.</p>
      </Card>
      <Card title="Recorded content (canonical JSON)" className="mt-4">
        <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-all text-xs">{canonical(p.payload)}</pre>
      </Card>
      <p className="mt-4 text-sm"><Link href="/" className="text-brand">Busongo</Link> · results are historical simulations, not a promise of future returns.</p>
    </div>
  );
}
