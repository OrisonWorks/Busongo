import { getUser } from "@/lib/auth";
import { planAtLeast, effectivePlan } from "@/config/plans";
import PlanLock from "@/components/PlanLock";
import { getBars } from "@/lib/market";
import { symbolOptions } from "@/lib/symbols";
import SymbolPicker from "@/components/SymbolPicker";
import ToolTabs from "@/components/ToolTabs";
import { Badge, Card, PageHeader } from "@/components/ui";
import PriceChart from "@/components/charts/PriceChart";
import { fairValueGaps, orderBlocks, structureBreaks, swings } from "@/lib/engine/smc";
import { fmt, fmtDate } from "@/lib/format";

export const metadata = { title: "Smart Money Concepts" };
export default async function Page({ searchParams }: { searchParams: Promise<{ symbol?: string }> }) {
  const viewer = await getUser();
  if (!planAtLeast(viewer?.effectivePlan ?? effectivePlan(null), "ADVANCED")) return (
    <div>
      <PageHeader title="Smart Money Concepts" subtitle="Swing structure (HH/HL/LH/LL), break of structure (BOS), change of character (CHoCH), order blocks and unfilled fair-value gaps." />
      <ToolTabs active="/tools/smc" />
      <PlanLock min="ADVANCED" feature="Smart Money tools" signedIn={!!viewer} />
    </div>
  );
  const syms = await symbolOptions();
  const symbol = ((await searchParams).symbol || syms.find((s) => s.group === "Crypto")?.symbol || syms[0]?.symbol || "").toUpperCase();
  const bars = (await getBars(symbol)).slice(-400);
  const sw = swings(bars);
  const { events, trend } = structureBreaks(bars, sw);
  const fvg = fairValueGaps(bars).filter((g) => !g.filled).slice(-8);
  const obs = orderBlocks(bars, events).slice(-6);
  const markers = events.slice(-30).map((e) => ({ date: e.date, kind: e.dir === "bull" ? ("buy" as const) : ("sell" as const), text: e.kind }));
  const levels = [...obs.map((o) => ({ price: o.dir === "bull" ? o.top : o.bottom, color: o.dir === "bull" ? "#22c55e" : "#ef4444", title: "OB" })), ...fvg.map((g) => ({ price: (g.top + g.bottom) / 2, color: "#a78bfa", title: "FVG" }))];
  return (
    <div>
      <PageHeader title="Smart Money Concepts" subtitle="Swing structure (HH/HL/LH/LL), break of structure (BOS), change of character (CHoCH), order blocks and unfilled fair-value gaps." />
      <ToolTabs active="/tools/smc" />
      <SymbolPicker symbols={syms} value={symbol} />
      <Card title={<span>{symbol} · structure {trend ? <Badge color={trend === "bull" ? "green" : "red"}>{trend === "bull" ? "Bullish" : "Bearish"}</Badge> : "undetermined"}</span>}>
        {bars.length > 10 ? <PriceChart bars={bars} markers={markers} levels={levels} height={420} /> : <p className="text-sm text-muted">Not enough history for structure analysis.</p>}
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Recent structure breaks"><table className="data"><tbody>{events.slice(-10).reverse().map((e, i) => <tr key={i}><td>{fmtDate(e.date)}</td><td>{e.kind}</td><td className={e.dir === "bull" ? "text-up" : "text-down"}>{e.dir}</td><td className="r">{fmt(e.level)}</td></tr>)}</tbody></table></Card>
        <Card title="Order blocks"><table className="data"><tbody>{obs.reverse().map((o, i) => <tr key={i}><td>{fmtDate(o.date)}</td><td className={o.dir === "bull" ? "text-up" : "text-down"}>{o.dir === "bull" ? "Demand" : "Supply"}</td><td className="r">{fmt(o.bottom)} – {fmt(o.top)}</td></tr>)}</tbody></table></Card>
        <Card title="Unfilled fair-value gaps"><table className="data"><tbody>{fvg.reverse().map((g, i) => <tr key={i}><td>{fmtDate(g.date)}</td><td className={g.dir === "bull" ? "text-up" : "text-down"}>{g.dir}</td><td className="r">{fmt(g.bottom)} – {fmt(g.top)}</td></tr>)}</tbody></table></Card>
      </div>
      <Card title="Swing points" className="mt-4"><div className="flex flex-wrap gap-1">{sw.slice(-24).map((s) => <span key={s.i + s.kind} className={`rounded px-2 py-1 text-xs ${s.kind === "high" ? "bg-red-500/10" : "bg-emerald-500/10"}`}>{s.label} {fmt(s.price)} · {s.date}</span>)}</div></Card>
    </div>
  );
}
