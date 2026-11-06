import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/config/plans";
import { provider } from "@/lib/pay";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, PageHeader } from "@/components/ui";
import { fmt } from "@/lib/format";
import { sandboxApprove, startPayment } from "./actions";

export const metadata = { title: "Upgrade" };
export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string; ref?: string }> }) {
  const { plan = "ADVANCED", ref } = await searchParams;
  const u = await requireUser("/payment");
  const pv = provider();
  if (ref) {
    const p = await prisma.payment.findFirst({ where: { reference: ref, userId: u.id } });
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Payment status" />
        <Card>
          {p ? <>
            <div className="mb-2 flex items-center justify-between"><span>{PLANS[p.plan].label} × {p.months} month{p.months > 1 ? "s" : ""}</span><Badge color={p.status === "success" ? "green" : p.status === "failed" ? "red" : "amber"}>{p.status}</Badge></div>
            <div className="text-2xl font-bold">K{fmt(p.amount)}</div>
            <div className="text-sm text-muted">Ref {p.reference} · {p.network} {p.phone}</div>
            {p.status === "pending" && <p className="mt-3 text-sm">Approve the Mobile Money prompt on your phone, then <Link href={`/payment?ref=${ref}`} className="text-brand">refresh this page</Link>.</p>}
            {p.status === "pending" && pv.id === "sandbox" && <form action={sandboxApprove.bind(null, p.reference)}><button className="btn btn-primary mt-3">Approve test payment</button></form>}
            {p.status === "success" && <Link href="/dashboard" className="btn btn-primary mt-4">Go to dashboard</Link>}
          </> : "Payment not found."}
        </Card>
      </div>
    );
  }
  const P = PLANS[plan as "ADVANCED"] ?? PLANS.ADVANCED;
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={`Upgrade to ${P.label}`} subtitle={`K${P.priceZmw}/month · pay with MTN, Airtel or Zamtel Mobile Money`} />
      {pv.id === "sandbox" && <div className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">Test mode: no real money is charged.</div>}
      <Card>
        <ActionForm action={startPayment} submit="Pay with Mobile Money" className="space-y-3">
          <div><label className="label">Plan</label><select name="plan" defaultValue={P.id} className="input"><option value="ADVANCED">Advanced · K{PLANS.ADVANCED.priceZmw}/mo</option><option value="PRO">Pro · K{PLANS.PRO.priceZmw}/mo</option></select></div>
          <div><label className="label">Billing period</label><select name="months" className="input"><option value="1">1 month</option><option value="3">3 months (5% off)</option><option value="6">6 months (10% off)</option><option value="12">12 months (20% off)</option></select></div>
          <div><label className="label">Mobile Money number</label><input name="phone" defaultValue={u.phone ?? ""} placeholder="0961234567" className="input" required /></div>
          <div><label className="label">Network</label><select name="network" className="input"><option value="">Detect from number</option><option value="MTN">MTN MoMo</option><option value="AIRTEL">Airtel Money</option><option value="ZAMTEL">Zamtel Kwacha</option></select></div>
        </ActionForm>
      </Card>
    </div>
  );
}
