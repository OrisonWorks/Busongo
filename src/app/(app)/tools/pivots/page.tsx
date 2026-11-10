import Link from "next/link";
import { getAllBars } from "@/lib/market";
import { pivots } from "@/lib/indicators";
import ToolTabs from "@/components/ToolTabs";
import { Card, PageHeader } from "@/components/ui";
import { fmt } from "@/lib/format";

export const metadata = { title: "Pivot Levels" };
export default async function Page({ searchParams }: { searchParams: Promise<{ asset?: string; tf?: string }> }) {
  const { asset = "EQUITY", tf = "daily" } = await searchParams;
  const data = await getAllBars(asset === "CRYPTO" ? "CRYPTO" : "EQUITY", new Date(Date.now() - 60 * 86400000));
  const n = tf === "weekly" ? 5 : tf === "monthly" ? 21 : 1;
  const rows = [...data].map(([s, b]) => { const w = b.slice(-n); if (!w.length) return null; const h = Math.max(...w.map((x) => x.high)), l = Math.min(...w.map((x) => x.low)), c = w.at(-1)!.close; return { s, c, ...pivots(h, l, c) }; }).filter(Boolean) as ({ s: string; c: number } & ReturnType<typeof pivots>)[];
  const q = (a: string, t: string) => `/tools/pivots?asset=${a}&tf=${t}`;
  return (
    <div>
      <PageHeader title="Pivot Levels" subtitle="Price levels traders watch as possible turning points, worked out from the last session, week or month." />
      <ToolTabs active="/tools/pivots" />
      <div className="mb-3 flex flex-wrap gap-2 text-sm">{["EQUITY", "CRYPTO"].map((a) => <Link key={a} href={q(a, tf)} className={`btn ${asset === a ? "btn-primary" : "btn-ghost"}`}>{a === "EQUITY" ? "LuSE" : "Crypto"}</Link>)}{["daily", "weekly", "monthly"].map((t) => <Link key={t} href={q(asset, t)} className={`btn ${tf === t ? "btn-primary" : "btn-ghost"}`}>{t}</Link>)}</div>
      <Card><div className="overflow-x-auto"><table className="data"><thead><tr><th>Symbol</th><th className="r">Close</th>{["S3", "S2", "S1", "Pivot", "R1", "R2", "R3"].map((h) => <th key={h} className="r">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.s}><td className="font-semibold">{r.s}</td><td className="num r">{fmt(r.c)}</td>{[r.s3, r.s2, r.s1, r.p, r.r1, r.r2, r.r3].map((v, i) => <td key={i} className={`num r ${i < 3 ? "text-up" : i > 3 ? "text-down" : ""}`}>{fmt(v)}</td>)}</tr>)}</tbody></table></div></Card>
    </div>
  );
}
