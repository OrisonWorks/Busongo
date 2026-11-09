"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSyncExternalStore } from "react";

const MQ = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => { const m = window.matchMedia(MQ); m.addEventListener("change", cb); const o = new MutationObserver(cb); o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] }); return () => { m.removeEventListener("change", cb); o.disconnect(); }; };
const reducedMotion = () => window.matchMedia(MQ).matches || document.documentElement.dataset.motion === "reduce";


export type LineDef = { key: string; name: string; color: string; dashed?: boolean };
const tip = { contentStyle: { background: "#0d1424", border: "1px solid #1e2a44", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "#e6ebf5" } };

export function LineChartBox({ data, x, lines, height = 300, unit = "", area = false, numericX = false }: { data: Record<string, unknown>[]; x: string; lines: LineDef[]; height?: number | `${number}%`; unit?: string; area?: boolean; numericX?: boolean }) {
  const C = area ? AreaChart : LineChart;
  const still = useSyncExternalStore(subscribe, reducedMotion, () => false);
  const recent = data.slice(-30);
  return (
    <div className={typeof height === "string" ? "h-full" : undefined}>
    <div aria-hidden="true" className={typeof height === "string" ? "h-full" : undefined}>
    <ResponsiveContainer width="100%" height={height}>
      <C data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#162036" vertical={false} />
        <XAxis dataKey={x} stroke="#8a96b0" fontSize={11} tickLine={false} type={numericX ? "number" : "category"} domain={numericX ? ["dataMin", "dataMax"] : undefined} minTickGap={24} />
        <YAxis stroke="#8a96b0" fontSize={11} tickLine={false} width={56} unit={unit} domain={["auto", "auto"]} />
        <Tooltip {...tip} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((l) =>
          area ? (
            <Area key={l.key} dataKey={l.key} name={l.name} stroke={l.color} fill={l.color + "33"} type="monotone" dot={false} connectNulls isAnimationActive={!still} />
          ) : (
            <Line key={l.key} dataKey={l.key} name={l.name} stroke={l.color} strokeDasharray={l.dashed ? "4 4" : undefined} type="monotone" dot={numericX} strokeWidth={2} connectNulls isAnimationActive={!still} />
          ),
        )}
      </C>
    </ResponsiveContainer>
    </div>
    <table className="sr-only">
      <caption>Chart data{data.length > recent.length ? `, latest ${recent.length} of ${data.length} points` : ""}</caption>
      <thead><tr><th scope="col">{x}</th>{lines.map((l) => <th key={l.key} scope="col">{l.name}</th>)}</tr></thead>
      <tbody>{recent.map((r, n) => <tr key={n}><th scope="row">{String(r[x] ?? "")}</th>{lines.map((l) => <td key={l.key}>{r[l.key] == null ? "" : `${String(r[l.key])}${unit}`}</td>)}</tr>)}</tbody>
    </table>
    </div>
  );
}

export function BarChartBox({ data, x, bars, height = 300, unit = "" }: { data: Record<string, unknown>[]; x: string; bars: LineDef[]; height?: number; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#162036" vertical={false} />
        <XAxis dataKey={x} stroke="#8a96b0" fontSize={11} tickLine={false} />
        <YAxis stroke="#8a96b0" fontSize={11} tickLine={false} width={56} unit={unit} />
        <Tooltip {...tip} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {bars.map((b) => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[3, 3, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}
