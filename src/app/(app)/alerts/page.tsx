import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteAlert } from "../actions";
import AlertForm from "@/components/AlertForm";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { PLANS } from "@/config/plans";
import { fmtDate } from "@/lib/format";
import { symbolOptions } from "@/lib/symbols";

export const metadata = { title: "Alerts" };
const ML: Record<string, string> = { close: "Close", changePct: "% change", volume: "Volume", value: "Value traded" };
export default async function Page() {
  const u = await requireUser("/alerts");
  const [alerts, syms] = await Promise.all([prisma.alert.findMany({ where: { userId: u.id }, include: { security: true }, orderBy: { createdAt: "desc" } }), symbolOptions()]);
  const active = alerts.filter((a) => a.active).length;
  return (
    <div>
      <PageHeader title="Alerts" subtitle={`Alerts are checked after each end-of-day update. ${active}/${PLANS[u.effectivePlan].alerts} active on your plan.`} />
      <Card title="New alert"><AlertForm symbols={syms.map((s) => s.symbol)} /></Card>
      <Card title="My alerts" className="mt-4">
        {alerts.length ? <table className="data"><thead><tr><th>Symbol</th><th>Condition</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>
          {alerts.map((a) => <tr key={a.id}><td className="font-semibold">{a.security.symbol}</td><td>{ML[a.metric]} {a.operator === "gt" ? ">" : "<"} {a.threshold}</td><td>{a.active ? <Badge color="green">Active</Badge> : <Badge color="amber">Triggered {fmtDate(a.triggeredAt)}</Badge>}</td><td>{fmtDate(a.createdAt)}</td><td><form action={deleteAlert.bind(null, a.id)}><button className="text-xs text-muted hover:text-down">Delete</button></form></td></tr>)}
        </tbody></table> : <Empty>No alerts yet.</Empty>}
      </Card>
    </div>
  );
}
