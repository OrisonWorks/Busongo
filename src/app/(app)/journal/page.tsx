import { prisma } from "@/lib/db";
import Glossed from "@/components/Glossed";
import { requireUser } from "@/lib/auth";
import { addJournal, deleteJournal } from "../actions";
import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { fmt, fmtDate, tone } from "@/lib/format";
import { symbolOptions } from "@/lib/symbols";

export const metadata = { title: "Trade Journal" };
export default async function Page() {
  const u = await requireUser("/journal");
  const [rows, syms] = await Promise.all([prisma.journalEntry.findMany({ where: { userId: u.id }, include: { security: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }), symbolOptions()]);
  // FIFO realised P&L per symbol
  const lots = new Map<string, { q: number; p: number }[]>();
  let realised = 0, wins = 0, closes = 0, fees = 0;
  for (const r of [...rows].reverse()) {
    fees += r.fees;
    const L = lots.get(r.security.symbol) || [];
    if (r.side === "BUY") L.push({ q: r.quantity, p: r.price + r.fees / r.quantity });
    else {
      let q = r.quantity, pnl = -r.fees;
      while (q > 0 && L.length) { const l = L[0]; const take = Math.min(q, l.q); pnl += take * (r.price - l.p); l.q -= take; q -= take; if (!l.q) L.shift(); }
      realised += pnl; closes++; if (pnl > 0) wins++;
    }
    lots.set(r.security.symbol, L);
  }
  const open = [...lots].map(([s, L]) => ({ s, q: L.reduce((a, l) => a + l.q, 0), cost: L.reduce((a, l) => a + l.q * l.p, 0) })).filter((x) => x.q > 0);
  return (
    <div>
      <PageHeader title="Trade Journal" subtitle="A notebook for trades you made in real life — fees default to LuSE's 1.375% — so you can see what you really gained or lost." />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label={<Glossed k="pnl">Realised P&L</Glossed>} value={<span className={tone(realised)}>K{fmt(realised)}</span>} />
        <Stat label="Closing trades" value={closes} sub={closes ? `${((wins / closes) * 100).toFixed(0)}% winners` : undefined} />
        <Stat label="Fees paid" value={`K${fmt(fees)}`} />
        <Stat label="Open positions" value={open.length} />
      </div>
      <Card title="Log a trade" className="mt-4">
        <ActionForm action={addJournal} submit="Add" className="grid gap-2 sm:grid-cols-8">
          <select name="symbol" className="input">{syms.map((s) => <option key={s.symbol}>{s.symbol}</option>)}</select>
          <select name="side" className="input"><option>BUY</option><option>SELL</option></select>
          <input name="quantity" type="number" step="any" placeholder="Qty" required className="input" />
          <input name="price" type="number" step="any" placeholder="Price" required className="input" />
          <input name="date" type="date" required className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
          <input name="tag" placeholder="Tag" className="input" />
          <input name="notes" placeholder="Notes" className="input" />
        </ActionForm>
      </Card>
      {open.length > 0 && <Card title="Open positions" className="mt-4"><table className="data"><thead><tr><th>Symbol</th><th className="r">Qty</th><th className="r">Avg cost</th></tr></thead><tbody>{open.map((o) => <tr key={o.s}><td>{o.s}</td><td className="r">{fmt(o.q, 0)}</td><td className="r">{fmt(o.cost / o.q)}</td></tr>)}</tbody></table></Card>}
      <Card title="Entries" className="mt-4">
        {rows.length ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Date</th><th>Symbol</th><th>Side</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Fees</th><th>Tag</th><th>Notes</th><th></th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}><td>{fmtDate(r.date)}</td><td>{r.security.symbol}</td><td className={r.side === "BUY" ? "text-up" : "text-down"}>{r.side}</td><td className="r">{fmt(r.quantity, 0)}</td><td className="r">{fmt(r.price)}</td><td className="r">{fmt(r.fees)}</td><td>{r.tag}</td><td className="max-w-[200px] truncate text-muted">{r.notes}</td><td><form action={deleteJournal.bind(null, r.id)}><button className="text-xs text-muted hover:text-down">Delete</button></form></td></tr>)}
        </tbody></table></div> : <Empty>No journal entries yet.</Empty>}
      </Card>
    </div>
  );
}
