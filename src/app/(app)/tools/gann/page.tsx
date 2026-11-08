import { getUser } from "@/lib/auth";
import { planAtLeast, effectivePlan } from "@/config/plans";
import PlanLock from "@/components/PlanLock";
import { getBars } from "@/lib/market";
import { symbolOptions } from "@/lib/symbols";
import SymbolPicker from "@/components/SymbolPicker";
import ToolTabs from "@/components/ToolTabs";
import { Card, PageHeader } from "@/components/ui";
import PriceChart from "@/components/charts/PriceChart";
import { fmt, fmtDate } from "@/lib/format";

export const metadata = { title: "Gann Tools" };
export default async function Page({ searchParams }: { searchParams: Promise<{ symbol?: string }> }) {
  const viewer = await getUser();
  if (!planAtLeast(viewer?.effectivePlan ?? effectivePlan(null), "ADVANCED")) return (
    <div>
      <PageHeader title="Gann Tools" subtitle="Square of 9 levels, Gann angles from the major low, and calendar time cycles." />
      <ToolTabs active="/tools/gann" />
      <PlanLock min="ADVANCED" feature="Gann tools" signedIn={!!viewer} />
    </div>
  );
  const syms = await symbolOptions();
  const symbol = ((await searchParams).symbol || syms[0]?.symbol || "").toUpperCase();
  const bars = await getBars(symbol);
  const last = bars.at(-1);
  const px = last?.close ?? 0;
  const root = Math.sqrt(px);
  const sq9 = [-1, -0.75, -0.5, -0.25, 0.25, 0.5, 0.75, 1].map((d) => ({ step: d, angle: d * 180, price: (root + d) ** 2 })).sort((a, b) => b.price - a.price);
  const piv = bars.length ? bars.reduce((a, b, i) => (b.low < bars[a].low ? i : a), 0) : 0;
  const low = bars[piv];
  const unit = low ? Math.max(low.close * 0.005, 0.01) : 0;
  const angles = [["1x8", 1 / 8], ["1x4", 1 / 4], ["1x2", 1 / 2], ["1x1", 1], ["2x1", 2], ["4x1", 4], ["8x1", 8]] as const;
  const fan = low ? angles.map(([n, r]) => ({ name: n, color: n === "1x1" ? "#f59e0b" : "#64748b", data: bars.slice(piv).map((b, k) => ({ date: b.date, value: low.low + k * unit * r })) })) : [];
  const cycles = low ? [30, 45, 60, 90, 120, 144, 180, 270, 360].map((d) => ({ d, date: new Date(+new Date(low.date) + d * 86400000).toISOString().slice(0, 10) })) : [];
  return (
    <div>
      <PageHeader title="Gann Tools" subtitle="Square of 9 levels, Gann angles from the major low, and calendar time cycles." />
      <ToolTabs active="/tools/gann" />
      <SymbolPicker symbols={syms} value={symbol} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Square of 9 · ${symbol} @ ${fmt(px)}`}>
          <table className="data"><thead><tr><th>Rotation</th><th className="r">Level</th></tr></thead><tbody>{sq9.map((s) => <tr key={s.step}><td>{s.angle > 0 ? "+" : ""}{s.angle}°</td><td className={`num r ${s.price > px ? "text-down" : "text-up"}`}>{fmt(s.price)}</td></tr>)}</tbody></table>
          <p className="mt-2 text-xs text-muted">Levels = (√price ± n)², where 1 = a full 360° rotation. Above price is resistance, below is support.</p>
        </Card>
        <Card title="Gann fan from major low" className="lg:col-span-2">
          {bars.length > 2 ? <PriceChart bars={bars} overlays={fan} height={340} /> : <p className="text-sm text-muted">Not enough history.</p>}
          <p className="mt-2 text-xs text-muted">Anchored at the lowest low ({fmtDate(low?.date)}, {fmt(low?.low)}). 1×1 = {fmt(unit, 4)} per session (0.5% of the anchor price).</p>
        </Card>
      </div>
      <Card title="Time cycles from the major low" className="mt-4">
        <div className="flex flex-wrap gap-2">{cycles.map((c) => <div key={c.d} className="rounded bg-panel2 px-3 py-2 text-sm"><div className="text-xs text-muted">{c.d} days</div>{fmtDate(c.date)}</div>)}</div>
      </Card>
    </div>
  );
}
