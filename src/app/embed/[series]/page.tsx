import { notFound } from "next/navigation";
import { LineChartBox } from "@/components/charts/LineChartBox";
import { findSeries, loadSeries } from "@/lib/feed";
import { ISO_DATE } from "@/lib/feed-format";
import { brand } from "@/config/brand";

export const revalidate = 3600;
export const metadata = { robots: { index: false } };

export default async function Embed({ params, searchParams }: { params: Promise<{ series: string }>; searchParams: Promise<{ from?: string }> }) {
  const s = findSeries((await params).series);
  if (!s) notFound();
  const { from } = await searchParams;
  const rows = await loadSeries(s, from && ISO_DATE.test(from) ? from : undefined);
  const lines = s.id === "lasi" ? s.columns.slice(0, 1) : s.columns.filter((c) => rows.some((r) => r[c.key] != null));
  const last = rows.at(-1);
  return (
    <div className="flex h-screen flex-col p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-semibold">{s.title}</div>
        {last && lines.length === 1 && <div className="text-sm text-muted">{String(last[lines[0].key] ?? "")}{s.unit} · {String(last.date)}</div>}
      </div>
      <div className="min-h-0 flex-1">
        {rows.length ? <LineChartBox data={rows} x="date" lines={lines} unit={s.unit} height="100%" /> : <p className="py-10 text-center text-sm text-muted">No data yet.</p>}
      </div>
      <a href={`${brand.siteUrl}/data`} target="_blank" rel="noopener" className="mt-1 text-[11px] text-muted hover:text-fg">
        Source: {s.source} · via {brand.name}. For research only, not investment advice.
      </a>
    </div>
  );
}
