import Link from "next/link";
import { getQuotes } from "@/lib/market";
import MarketTabs from "@/components/MarketTabs";
import { PageHeader } from "@/components/ui";
import { compact, pct } from "@/lib/format";

export const metadata = { title: "Heatmap" };
export const revalidate = 300;
const color = (c: number | null) => {
  if (c == null || c === 0) return "rgba(100,116,139,.35)";
  const a = Math.min(1, 0.25 + Math.abs(c) / 8);
  return c > 0 ? `rgba(34,197,94,${a})` : `rgba(239,68,68,${a})`;
};
export default async function Page() {
  const q = await getQuotes();
  const sectors = [...new Set(q.map((x) => x.sector || "Other"))].sort();
  return (
    <div>
      <PageHeader title="Heatmap" subtitle="Tiles are coloured by daily % change and sized by value traded." />
      <MarketTabs active="/market/heatmap" />
      <div className="space-y-4">
        {sectors.map((s) => (
          <div key={s}>
            <div className="mb-1 text-xs font-semibold uppercase text-muted">{s}</div>
            <div className="flex flex-wrap gap-1.5">
              {q.filter((x) => (x.sector || "Other") === s).map((x) => (
                <Link key={x.symbol} href={`/stocks/${x.symbol}`} style={{ background: color(x.changePct), flexGrow: Math.max(1, Math.log10((x.value ?? 0) + 10)) }} className="min-w-[110px] rounded-md p-3 hover:ring-2 hover:ring-white/30">
                  <div className="font-semibold">{x.symbol}</div>
                  <div className="num text-sm">{pct(x.changePct)}</div>
                  <div className="text-[11px] opacity-75">K{compact(x.value)}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
