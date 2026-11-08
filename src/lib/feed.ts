import "server-only";
import { getIndex, getMacro } from "./market";
import { bondHistory, tbillHistory, TBILL_TENORS } from "./fixed-income";
import { pivot, type Row } from "./feed-format";

export type Column = { key: string; name: string; color: string };
export type Series = { id: string; title: string; unit: string; source: string; columns: Column[]; load: () => Promise<Row[]> };

const macro = (key: string) => async () => (await getMacro(key)).map((r) => ({ date: r.date, value: r.value }));
const BOND_COLORS = ["#10b981", "#38bdf8", "#a78bfa", "#f59e0b", "#f43f5e", "#22d3ee"];

export const SERIES: Series[] = [
  {
    id: "lasi", title: "LuSE All Share Index (LASI)", unit: "", source: "Lusaka Securities Exchange",
    columns: [{ key: "value", name: "LASI", color: "#10b981" }, { key: "pctChange", name: "Change %", color: "#38bdf8" }],
    load: async () => (await getIndex("LASI")).map((r) => ({ date: r.date, value: r.value, pctChange: r.pctChange })),
  },
  {
    id: "tbills", title: "GRZ Treasury bill auction yields", unit: "%", source: "Bank of Zambia",
    columns: TBILL_TENORS.map((t, i) => ({ key: `d${t}`, name: `${t}-day`, color: BOND_COLORS[i] })),
    load: async () => pivot(await tbillHistory(), (r) => r.auctionDate, (r) => `d${r.tenorDays}`, (r) => r.yield),
  },
  {
    id: "bonds", title: "GRZ bond auction yields", unit: "%", source: "Bank of Zambia",
    columns: [2, 3, 5, 7, 10, 15].map((t, i) => ({ key: `y${t}`, name: `${t}-year`, color: BOND_COLORS[i] })),
    load: async () => pivot(await bondHistory(), (r) => r.auctionDate, (r) => `y${r.tenorYears}`, (r) => r.yield),
  },
  { id: "usdzmw", title: "BoZ USD/ZMW exchange rate", unit: "", source: "Bank of Zambia", columns: [{ key: "value", name: "USD/ZMW", color: "#f59e0b" }], load: macro("USDZMW") },
  { id: "policy-rate", title: "BoZ monetary policy rate", unit: "%", source: "Bank of Zambia", columns: [{ key: "value", name: "Policy rate", color: "#a78bfa" }], load: macro("MPR") },
  { id: "inflation", title: "Zambia annual inflation", unit: "%", source: "Zambia Statistics Agency via Bank of Zambia", columns: [{ key: "value", name: "Inflation", color: "#f43f5e" }], load: macro("INFLATION") },
];

export const findSeries = (id: string) => SERIES.find((s) => s.id === id);

export async function loadSeries(s: Series, from?: string) {
  const rows = await s.load();
  return from ? rows.filter((r) => String(r.date) >= from) : rows;
}
