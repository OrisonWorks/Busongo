import { notFound } from "next/navigation";
import { PAPER_TRADING_ENABLED } from "@/config/features";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getQuotes } from "@/lib/market";
import { paperTrade } from "../actions";
import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { fmt, fmtDate, pct, tone } from "@/lib/format";
import { PAPER_START, paperBook } from "@/lib/paper";

export const metadata = { title: "Paper Trading" };
export default async function Page() {
  if (!PAPER_TRADING_ENABLED) notFound();
  const u = await requireUser("/paper");
  const [trades, eq, cr] = await Promise.all([prisma.paperTrade.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } }), getQuotes("EQUITY"), getQuotes("CRYPTO")]);
  const px = new Map([...eq, ...cr].map((q) => [q.symbol, q.close ?? 0]));
  const { cash, pos } = paperBook([...trades].reverse());
  const holdings = [...pos].filter(([, p]) => p.q > 0).map(([s, p]) => ({ s, ...p, mv: p.q * (px.get(s) ?? 0) }));
  const total = cash + holdings.reduce((a, h) => a + h.mv, 0);
  return (
    <div>
      <PageHeader title="Paper Trading" subtitle={`Practise buying and selling with play money (K${fmt(PAPER_START, 0)} virtual) — fills use real closing prices and fees, but no real money is involved.`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Portfolio value" value={`K${fmt(total)}`} change={(total / PAPER_START - 1) * 100} />
        <Stat label="Cash" value={`K${fmt(cash)}`} />
        <Stat label="Holdings" value={holdings.length} />
      </div>
      <Card title="Place order" className="mt-4">
        <ActionForm action={paperTrade} submit="Submit">
          <select name="symbol" className="input">{[...eq, ...cr].map((q) => <option key={q.symbol}>{q.symbol}</option>)}</select>
          <select name="side" className="input"><option>BUY</option><option>SELL</option></select>
          <input name="quantity" type="number" step="any" placeholder="Quantity" required className="input" />
        </ActionForm>
      </Card>
      <Card title="Holdings" className="mt-4">
        {holdings.length ? <table className="data"><thead><tr><th>Symbol</th><th className="r">Qty</th><th className="r">Avg cost</th><th className="r">Price</th><th className="r">Value</th><th className="r">P&L</th></tr></thead><tbody>
          {holdings.map((h) => <tr key={h.s}><td>{h.s}</td><td className="r">{fmt(h.q, 4)}</td><td className="r">{fmt(h.cost / h.q)}</td><td className="r">{fmt(px.get(h.s))}</td><td className="r">{fmt(h.mv)}</td><td className={`r ${tone(h.mv - h.cost)}`}>{pct((h.mv / h.cost - 1) * 100)}</td></tr>)}
        </tbody></table> : <Empty>No holdings yet.</Empty>}
      </Card>
      <Card title="Order history" className="mt-4">
        {trades.length ? <table className="data"><tbody>{trades.map((t) => <tr key={t.id}><td>{fmtDate(t.createdAt)}</td><td>{t.symbol}</td><td className={t.side === "BUY" ? "text-up" : "text-down"}>{t.side}</td><td className="r">{fmt(t.quantity, 4)}</td><td className="r">@ {fmt(t.price)}</td><td className="r text-muted">fees {fmt(t.fees)}</td></tr>)}</tbody></table> : <Empty>No orders yet.</Empty>}
      </Card>
    </div>
  );
}
