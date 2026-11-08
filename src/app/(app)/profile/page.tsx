import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/config/plans";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, PageHeader } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/format";
import { changePassword, updateProfile } from "./actions";
import { NEAR, accountUrl } from "@/lib/web3/near";

export const metadata = { title: "Profile" };
export default async function Page() {
  const u = await requireUser("/profile");
  const pays = await prisma.payment.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Profile"><form action="/logout" method="post"><button className="btn btn-ghost">Sign out</button></form></PageHeader>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Account">
          <ActionForm action={updateProfile} submit="Save" className="space-y-2">
            <div><label className="label">Email</label><input className="input" value={u.email} disabled /></div>
            <div><label className="label">Name</label><input name="name" className="input" defaultValue={u.name ?? ""} /></div>
            <div><label className="label">Mobile number</label><input name="phone" className="input" defaultValue={u.phone ?? ""} placeholder="0971234567" /></div>
          </ActionForm>
        </Card>
        <Card title="Plan">
          <div className="text-2xl font-bold">{PLANS[u.effectivePlan].label}</div>
          {u.planExpiresAt && u.effectivePlan !== "FREE" && <p className="text-sm text-muted">Active until {fmtDate(u.planExpiresAt)}</p>}
          <Link href="/pricing" className="btn btn-primary mt-4">Change plan</Link>
        </Card>
        <Card title="Password">
          <ActionForm action={changePassword} submit="Change password" className="space-y-2">
            <input name="current" type="password" placeholder="Current password" className="input" required />
            <input name="password" type="password" placeholder="New password" className="input" required />
          </ActionForm>
        </Card>
      </div>
      <Card title="NEAR wallet" className="mt-4">
        {u.nearAccountId ? <p className="break-all text-sm">Linked to <a className="text-brand" href={accountUrl(u.nearAccountId)} target="_blank" rel="noreferrer">{u.nearAccountId}</a> ({NEAR.network}). You can sign in with this wallet.</p>
          : <div className="flex flex-wrap items-center gap-3"><p className="text-sm text-muted">Link a NEAR account to sign in with your wallet and pay in stablecoins.</p><a href="/api/auth/near/start?link=1" className="btn btn-ghost">Link NEAR wallet</a></div>}
      </Card>
      <Card title="Payments" className="mt-4">
        {pays.length ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Date</th><th>Plan</th><th className="r">Amount</th><th>Method</th><th>Reference</th><th>Status</th></tr></thead><tbody>
          {pays.map((p) => <tr key={p.id}><td>{fmtDate(p.createdAt)}</td><td>{p.plan} × {p.months}m</td><td className="r">{p.currency === "ZMW" ? `K${fmt(p.amount)}` : `${fmt(p.amount)} ${p.currency}`}</td><td>{p.network ?? p.provider}</td><td className="text-muted">{p.reference}</td><td><Badge color={p.status === "success" ? "green" : p.status === "failed" ? "red" : "amber"}>{p.status}</Badge></td></tr>)}
        </tbody></table></div> : <p className="text-sm text-muted">No payments yet.</p>}
      </Card>
    </div>
  );
}
