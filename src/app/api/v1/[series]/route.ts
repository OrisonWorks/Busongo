import { NextResponse } from "next/server";
import { findSeries, loadSeries } from "@/lib/feed";
import { ISO_DATE, toCsv } from "@/lib/feed-format";
import { brand } from "@/config/brand";

const HEADERS = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export async function GET(req: Request, { params }: { params: Promise<{ series: string }> }) {
  const id = (await params).series.replace(/\.csv$/, "");
  const s = findSeries(id);
  if (!s) return NextResponse.json({ error: "unknown series" }, { status: 404, headers: HEADERS });
  const q = new URL(req.url).searchParams;
  const from = q.get("from") || undefined;
  if (from && !ISO_DATE.test(from)) return NextResponse.json({ error: "from must be YYYY-MM-DD" }, { status: 400, headers: HEADERS });
  const rows = await loadSeries(s, from);
  const columns = ["date", ...s.columns.map((c) => c.key)];
  if (q.get("format") === "csv" || (await params).series.endsWith(".csv"))
    return new NextResponse(toCsv(columns, rows), { headers: { ...HEADERS, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `inline; filename="busongo-${s.id}.csv"` } });
  return NextResponse.json({
    series: s.id, title: s.title, unit: s.unit, source: s.source, columns,
    attribution: `Data via ${brand.name} (${brand.siteUrl}/data). For research and education only; not investment advice.`,
    rows,
  }, { headers: HEADERS });
}
