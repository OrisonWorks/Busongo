import "server-only";
import { getIndex, getMacro } from "./market";
import { tbillHistory } from "./fixed-income";
import { tbillNet, WHT_DEFAULT } from "./fi";
import { direction, monthChange, since } from "./plain";
import { fmt, fmtDate, kwacha } from "./format";
import { t, type Key, type Locale } from "./i18n";

export type Topic = "dollar" | "prices" | "tbill" | "rate" | "lasi";
export type PlainCard = { id: Topic; title: string; big: string; line: string; month?: string; explain: string; dir?: "up" | "down" | "same" };

export async function plainFacts() {
  const [fx, inflation, mpr, tb, lasi] = await Promise.all([getMacro("USDZMW"), getMacro("INFLATION"), getMacro("MPR"), tbillHistory(), getIndex("LASI")]);
  const latest = new Map<number, { days: number; yield: number; date: string }>();
  for (const r of tb) latest.set(r.tenorDays, { days: r.tenorDays, yield: r.yield, date: r.auctionDate });
  const tenors = [...latest.values()].sort((a, b) => a.days - b.days);
  const oneYear = latest.get(364) ?? tenors.at(-1);
  return {
    fx: monthChange(fx), inflation: monthChange(inflation), inflationSeries: inflation,
    mpr: mpr.at(-1), mprSince: since(mpr), tenors, oneYear, wht: WHT_DEFAULT,
    lasi: lasi.at(-1), updated: [fx.at(-1)?.date, inflation.at(-1)?.date, tb.at(-1)?.auctionDate].filter(Boolean).sort().at(-1),
  };
}
export type Facts = Awaited<ReturnType<typeof plainFacts>>;

export function plainCards(f: Facts, l: Locale, topics: Topic[] = ["dollar", "prices", "tbill", "rate", "lasi"]): PlainCard[] {
  const tt = (k: Key, v?: Record<string, string | number>) => t(l, k, v);
  const change = (p: number | null | undefined) => (p == null ? "" : `${fmt(Math.abs(p), 1)}%`);
  const cards: Partial<Record<Topic, PlainCard | null>> = {
    dollar: f.fx && {
      id: "dollar", title: tt("dollar.title"), big: kwacha(f.fx.now.value), line: tt("dollar.line", { now: kwacha(f.fx.now.value) }),
      month: f.fx.prev ? tt("dollar.month", { then: kwacha(f.fx.prev.value), dir: tt(direction(f.fx.pct)), change: change(f.fx.pct) }) : undefined,
      explain: tt("dollar.explain"), dir: direction(f.fx.pct),
    },
    prices: f.inflation && {
      id: "prices", title: tt("prices.title"), big: `${fmt(f.inflation.now.value, 1)}%`,
      line: tt("prices.line", { rate: `${fmt(f.inflation.now.value, 1)}%`, now: kwacha(100 * (1 + f.inflation.now.value / 100), 0) }),
      month: f.inflation.prev ? tt("prices.month", { then: `${fmt(f.inflation.prev.value, 1)}%` }) : undefined,
      explain: tt("prices.explain"), dir: direction(f.inflation.prev ? f.inflation.now.value - f.inflation.prev.value : null),
    },
    tbill: f.oneYear && (() => {
      const back = kwacha(1000 + tbillNet(1000, f.oneYear.yield, f.oneYear.days, f.wht).net, 0);
      return { id: "tbill" as const, title: tt("tbill.title"), big: back, line: tt("tbill.line", { amount: back }), month: tt("tbill.month", { rate: `${fmt(f.oneYear.yield)}%`, date: fmtDate(f.oneYear.date) }), explain: tt("tbill.explain") };
    })(),
    rate: f.mpr && { id: "rate", title: tt("rate.title"), big: `${fmt(f.mpr.value)}%`, line: tt("rate.line", { rate: `${fmt(f.mpr.value)}%` }), month: f.mprSince ? tt("rate.month", { date: fmtDate(f.mprSince) }) : undefined, explain: tt("rate.explain") },
    lasi: f.lasi && {
      id: "lasi", title: tt("lasi.title"), big: fmt(f.lasi.value), line: tt("lasi.line", { value: fmt(f.lasi.value) }),
      month: f.lasi.pctChange != null ? tt("lasi.month", { dir: tt(direction(f.lasi.pctChange, 0.005)), change: change(f.lasi.pctChange) }) : undefined,
      explain: tt("lasi.explain"), dir: direction(f.lasi.pctChange, 0.005),
    },
  };
  return topics.map((k) => cards[k]).filter((c): c is PlainCard => !!c);
}

export const cardSpeech = (c: PlainCard) => [c.title, c.line, c.month, c.explain].filter(Boolean).join(". ");
