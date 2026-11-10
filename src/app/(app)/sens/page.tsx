import Link from "next/link";
import { getAnnouncements } from "@/lib/market";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import Glossed from "@/components/Glossed";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "SENS Announcements" };
export const revalidate = 600;
export default async function Page({ searchParams }: { searchParams: Promise<{ symbol?: string }> }) {
  const { symbol } = await searchParams;
  const a = await getAnnouncements(300, symbol?.toUpperCase());
  return (
    <div>
      <PageHeader title="SENS Announcements" subtitle={<>Official <Glossed k="sens">SENS</Glossed> filings from LuSE-listed companies: results, dividends, cautionaries and corporate actions — the things companies must tell the public.</>} />
      <Card>{a.length ? <table className="data"><thead><tr><th>Date</th><th>Company</th><th>Announcement</th><th>Type</th><th></th></tr></thead><tbody>
        {a.map((x) => <tr key={x.id}><td>{fmtDate(x.date)}</td><td>{x.security ? <Link className="text-brand" href={`/stocks/${x.security.symbol}`}>{x.security.symbol}</Link> : "—"}</td><td className="whitespace-normal">{x.title}{x.summary && <div className="mt-1 max-w-2xl whitespace-pre-line text-xs text-muted"><span className="mr-1 rounded bg-brand/15 px-1 text-[10px] font-semibold text-brand">AI summary</span>{x.summary}</div>}</td><td><Badge>{x.category ?? "Announcement"}</Badge></td><td>{x.url && <a href={x.url} target="_blank" rel="noreferrer" className="text-xs text-brand">PDF ↗</a>}</td></tr>)}
      </tbody></table> : <Empty>No announcements stored yet. New SENS filings are pasted from luse.co.zm in /admin.</Empty>}</Card>
    </div>
  );
}
