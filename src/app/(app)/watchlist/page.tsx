import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getQuotes } from "@/lib/market";
import QuoteTable from "@/components/QuoteTable";
import { Card, Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "Watchlist" };
export default async function Page() {
  const u = await requireUser("/watchlist");
  const [w, eq, cr] = await Promise.all([prisma.watchItem.findMany({ where: { userId: u.id } }), getQuotes("EQUITY"), getQuotes("CRYPTO")]);
  const s = new Set(w.map((x) => x.symbol));
  const rows = [...eq, ...cr].filter((q) => s.has(q.symbol));
  return (
    <div>
      <PageHeader title="Watchlist" subtitle="Shares you chose to keep an eye on — add one with the ☆ Watch button on any stock page.">
        <Link href="/scanner" className="btn btn-ghost">Scan my watchlist</Link>
      </PageHeader>
      <Card>{rows.length ? <QuoteTable rows={rows} /> : <Empty>Your watchlist is empty. Browse <Link href="/stocks" className="text-brand">all stocks</Link>.</Empty>}</Card>
    </div>
  );
}
