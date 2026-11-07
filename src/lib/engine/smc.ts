import type { Candle } from "./series";

export type Swing = { i: number; date: string; price: number; kind: "high" | "low"; label?: "HH" | "HL" | "LH" | "LL" };
export function swings(b: Candle[], k = 3): Swing[] {
  const out: Swing[] = [];
  for (let i = k; i < b.length - k; i++) {
    const w = b.slice(i - k, i + k + 1);
    if (b[i].high === Math.max(...w.map((x) => x.high))) out.push({ i, date: b[i].date, price: b[i].high, kind: "high" });
    if (b[i].low === Math.min(...w.map((x) => x.low))) out.push({ i, date: b[i].date, price: b[i].low, kind: "low" });
  }
  let ph: number | null = null, pl: number | null = null;
  for (const s of out) {
    if (s.kind === "high") { s.label = ph == null || s.price > ph ? "HH" : "LH"; ph = s.price; }
    else { s.label = pl == null || s.price > pl ? "HL" : "LL"; pl = s.price; }
  }
  return out;
}
export function structureBreaks(b: Candle[], sw: Swing[]) {
  const ev: { date: string; kind: "BOS" | "CHoCH"; dir: "bull" | "bear"; level: number }[] = [];
  let trend: "bull" | "bear" | null = null;
  let lastHigh: Swing | null = null, lastLow: Swing | null = null;
  let si = 0;
  for (let i = 0; i < b.length; i++) {
    while (si < sw.length && sw[si].i + 3 <= i) { if (sw[si].kind === "high") lastHigh = sw[si]; else lastLow = sw[si]; si++; }
    if (lastHigh && b[i].close > lastHigh.price) { ev.push({ date: b[i].date, kind: trend === "bear" ? "CHoCH" : "BOS", dir: "bull", level: lastHigh.price }); trend = "bull"; lastHigh = null; }
    else if (lastLow && b[i].close < lastLow.price) { ev.push({ date: b[i].date, kind: trend === "bull" ? "CHoCH" : "BOS", dir: "bear", level: lastLow.price }); trend = "bear"; lastLow = null; }
  }
  return { events: ev, trend };
}
export function fairValueGaps(b: Candle[]) {
  const g: { date: string; dir: "bull" | "bear"; top: number; bottom: number; filled: boolean }[] = [];
  for (let i = 2; i < b.length; i++) {
    if (b[i].low > b[i - 2].high) g.push({ date: b[i - 1].date, dir: "bull", top: b[i].low, bottom: b[i - 2].high, filled: b.slice(i + 1).some((x) => x.low <= b[i - 2].high) });
    if (b[i].high < b[i - 2].low) g.push({ date: b[i - 1].date, dir: "bear", top: b[i - 2].low, bottom: b[i].high, filled: b.slice(i + 1).some((x) => x.high >= b[i - 2].low) });
  }
  return g;
}
export function orderBlocks(b: Candle[], events: ReturnType<typeof structureBreaks>["events"]) {
  const idx = new Map(b.map((x, i) => [x.date, i]));
  return events.map((e) => {
    const i = idx.get(e.date)!;
    for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
      const down = b[j].close < b[j].open, up = b[j].close > b[j].open;
      if ((e.dir === "bull" && down) || (e.dir === "bear" && up)) return { date: b[j].date, dir: e.dir, top: b[j].high, bottom: b[j].low };
    }
    return null;
  }).filter(Boolean) as { date: string; dir: "bull" | "bear"; top: number; bottom: number }[];
}
