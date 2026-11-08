import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/config/plans";
import { provider } from "@/lib/pay";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, PageHeader } from "@/components/ui";
import { fmt } from "@/lib/format";
import { confirmStablePayment, sandboxApprove, startPayment, startStablePayment } from "./actions";
import { NEAR, accountUrl, stablePaymentsEnabled, txUrl } from "@/lib/web3/near";
import { PAYMENTS_ENABLED } from "@/config/features";

export const metadata = { title: "Upgrade" };
export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string; ref?: string }> }) {
  if (!PAYMENTS_ENABLED) notFound();
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
            <div className="text-2xl font-bold">{p.provider === "near" ? `${fmt(p.amount)} ${p.currency}` : `K${fmt(p.amount)}`}</div>
            <div className="text-sm text-muted">Ref {p.reference} · {p.provider === "near" ? `NEAR ${p.network}` : `${p.network} ${p.phone}`}</div>
            {p.provider === "near" && p.externalRef && <a className="text-sm text-brand" href={txUrl(p.externalRef)} target="_blank" rel="noreferrer">View transaction</a>}
            {p.provider === "near" && p.status === "pending" && <div className="mt-3 space-y-3 text-sm">
              <ol className="list-decimal space-y-1 pl-5">
                <li>In your NEAR wallet, send <b>{fmt(p.amount)} {p.currency}</b> (contract <code className="break-all">{NEAR.tokens[p.currency as "USDC"]}</code>) to <a className="text-brand" href={accountUrl(NEAR.merchant)} target="_blank" rel="noreferrer">{NEAR.merchant}</a>.</li>
                <li>Set the memo to <code className="font-bold">{p.reference}</code>. Payments without it can&apos;t be matched.</li>
                <li>Paste the transaction hash below.</li>
              </ol>
              <ActionForm action={confirmStablePayment} submit="Verify payment" className="space-y-2">
                <input type="hidden" name="ref" value={p.reference} />
                <div><label className="label">Paid from (NEAR account)</label><input name="sender" defaultValue={u.nearAccountId ?? ""} placeholder="yourname.testnet" className="input" required /></div>
                <div><label className="label">Transaction hash</label><input name="txHash" placeholder="e.g. 78xbSGoZ…" className="input" required /></div>
              </ActionForm>
            </div>}
            {p.provider !== "near" && p.status === "pending" && <p className="mt-3 text-sm">Approve the Mobile Money prompt on your phone, then <Link href={`/payment?ref=${ref}`} className="text-brand">refresh this page</Link>.</p>}
            {p.status === "pending" && p.provider === "sandbox" && pv.id === "sandbox" && <form action={sandboxApprove.bind(null, p.reference)}><button className="btn btn-primary mt-3">Approve test payment</button></form>}
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
      {stablePaymentsEnabled() && <Card title="Or pay with stablecoins on NEAR" className="mt-4">
        <p className="mb-3 text-xs text-muted">Priced at the latest BoZ USD/ZMW rate. You pay straight from your wallet; Busongo never holds your keys. {NEAR.network === "testnet" && "Testnet: use test tokens only."}</p>
        <ActionForm action={startStablePayment} submit="Continue with stablecoin" className="space-y-3">
          <div><label className="label">Plan</label><select name="plan" defaultValue={P.id} className="input"><option value="ADVANCED">Advanced</option><option value="PRO">Pro</option></select></div>
          <div><label className="label">Billing period</label><select name="months" className="input"><option value="1">1 month</option><option value="3">3 months (5% off)</option><option value="6">6 months (10% off)</option><option value="12">12 months (20% off)</option></select></div>
          <div><label className="label">Token</label><select name="token" className="input"><option value="USDC">USDC</option><option value="USDT">USDT</option></select></div>
        </ActionForm>
      </Card>}
    </div>
  );
}
