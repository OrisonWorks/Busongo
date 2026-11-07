import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import ActionForm from "@/components/ActionForm";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { dataStatus } from "@/lib/market";
import { fmtDate } from "@/lib/format";
import { addCorporateAction, importFundamentalsAction, importPricesAction, runIngest, setPlan } from "./actions";
import FundamentalsExtractor from "./FundamentalsExtractor";
import { aiConfigured } from "@/lib/ai";

export const metadata = { title: "Admin" };
export default async function Page() {
  await requireAdmin();
  const [runs, users, nUsers, pays, msgs, ds, syms] = await Promise.all([
    prisma.ingestRun.findMany({ orderBy: { startedAt: "desc" }, take: 15 }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.user.count(),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: true } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    dataStatus(),
    prisma.security.findMany({ where: { assetClass: "EQUITY" }, orderBy: { symbol: "asc" }, select: { symbol: true } }),
  ]);
  const paid = pays.filter((p) => p.status === "success").reduce((a, p) => a + p.amount, 0);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="Admin" subtitle="Data ingestion, imports, users and payments." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Users" value={nUsers} />
        <Stat label="LuSE sessions stored" value={ds.equitySessions} sub={`${fmtDate(ds.equityFirst)} → ${fmtDate(ds.equityLast)}`} />
        <Stat label="Latest crypto bar" value={fmtDate(ds.cryptoLast)} />
        <Stat label="Recent revenue" value={`K${paid.toFixed(2)}`} sub="last 20 payments" />
      </div>
      <Card title="Ingestion" className="mt-4">
        <div className="mb-3 flex gap-2">{(["luse", "boz", "crypto", "p2p", "defi", "brief", "sens-ai"] as const).map((j) => <form key={j} action={runIngest.bind(null, j)}><button className="btn btn-ghost">{j === "brief" ? "Generate daily brief" : j === "sens-ai" ? "Summarise SENS (AI)" : `Run ${j.toUpperCase()} now`}</button></form>)}</div>
        <table className="data"><thead><tr><th>Started</th><th>Source</th><th>Status</th><th>Message</th></tr></thead><tbody>{runs.map((r) => <tr key={r.id}><td>{r.startedAt.toISOString().slice(0, 16).replace("T", " ")}</td><td>{r.source}</td><td><Badge color={r.status === "ok" ? "green" : r.status === "error" ? "red" : "amber"}>{r.status}</Badge></td><td className="max-w-[480px] truncate text-xs text-muted">{r.message}</td></tr>)}</tbody></table>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Import price history (CSV)">
          <p className="mb-2 text-xs text-muted">Columns: <code>date,symbol,close</code> plus optional <code>open,high,low,volume,value,trades</code>. Dates YYYY-MM-DD or DD/MM/YYYY. Existing days are overwritten.</p>
          <ActionForm action={importPricesAction} submit="Import prices" className="space-y-2"><input type="file" name="file" accept=".csv,text/csv" className="input" /><textarea name="csv" rows={4} className="input font-mono text-xs" placeholder="date,symbol,close,volume&#10;2024-01-02,ZSUG,35.5,1200" /></ActionForm>
        </Card>
        <Card title="Import fundamentals (CSV)">
          <p className="mb-2 text-xs text-muted">Columns: <code>symbol,fiscalyear</code> plus any of revenue, grossprofit, operatingprofit, netincome, totalassets, totalliabilities, totalequity, totaldebt, cash, operatingcashflow, capex, eps, dps, sharesoutstanding, sourceurl.</p>
          <ActionForm action={importFundamentalsAction} submit="Import fundamentals" className="space-y-2"><input type="file" name="file" accept=".csv,text/csv" className="input" /><textarea name="csv" rows={4} className="input font-mono text-xs" placeholder="symbol,fiscalyear,revenue,netincome,eps,dps" /></ActionForm>
        </Card>
      </div>
      <Card title="Extract fundamentals from a report (AI)" className="mt-4">
        <FundamentalsExtractor symbols={syms.map((s) => s.symbol)} configured={aiConfigured()} />
      </Card>
      <Card title="Add corporate action" className="mt-4">
        <ActionForm action={addCorporateAction} submit="Add" className="grid gap-2 sm:grid-cols-7">
          <select name="symbol" className="input">{syms.map((s) => <option key={s.symbol}>{s.symbol}</option>)}</select>
          <select name="type" className="input"><option>Dividend</option><option>Special dividend</option><option>Rights issue</option><option>Share split</option><option>AGM</option><option>Results</option></select>
          <input name="amount" type="number" step="any" placeholder="Amount (K)" className="input" />
          <input name="exDate" type="date" className="input" title="Ex-date" />
          <input name="payDate" type="date" className="input" title="Pay date" />
          <input name="notes" placeholder="Notes" className="input" />
        </ActionForm>
      </Card>
      <Card title="Users" className="mt-4"><div className="overflow-x-auto"><table className="data"><thead><tr><th>Email</th><th>Name</th><th>Phone</th><th>Plan</th><th>Expires</th><th>Joined</th><th>Set plan</th></tr></thead><tbody>
        {users.map((u) => <tr key={u.id}><td>{u.email} {u.role === "ADMIN" && <Badge color="blue">admin</Badge>}</td><td>{u.name}</td><td>{u.phone}</td><td>{u.plan}</td><td>{fmtDate(u.planExpiresAt)}</td><td>{fmtDate(u.createdAt)}</td><td><form action={setPlan.bind(null, u.id)} className="flex gap-1"><select name="plan" defaultValue={u.plan} className="input w-auto py-1 text-xs"><option>FREE</option><option>ADVANCED</option><option>PRO</option></select><input name="months" type="number" defaultValue={1} className="input w-14 py-1 text-xs" /><button className="text-xs text-brand">Save</button></form></td></tr>)}
      </tbody></table></div></Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Payments"><table className="data"><tbody>{pays.map((p) => <tr key={p.id}><td>{fmtDate(p.createdAt)}</td><td>{p.user.email}</td><td>{p.plan}×{p.months}</td><td className="r">K{p.amount}</td><td>{p.status}</td></tr>)}</tbody></table></Card>
        <Card title="Contact messages">{msgs.map((m) => <div key={m.id} className="border-b border-line/50 py-2 text-sm"><b>{m.firstName} {m.lastName}</b> &lt;{m.email}&gt; · {fmtDate(m.createdAt)}<div className="text-muted">{m.message}</div></div>)}</Card>
      </div>
    </div>
  );
}
