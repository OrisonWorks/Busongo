export type Pt = { date: string; value: number };
export type Dir = "up" | "down" | "same";

const DAY = 864e5;
export const daysBefore = (date: string, days: number) => new Date(Date.parse(date + "T00:00:00Z") - days * DAY).toISOString().slice(0, 10);

export function valueOnOrBefore(rows: Pt[], date: string) {
  let v: Pt | undefined;
  for (const r of rows) { if (r.date <= date) v = r; else break; }
  return v;
}

/** Latest point vs the point about a month earlier. */
export function monthChange(rows: Pt[]) {
  const now = rows.at(-1);
  if (!now) return null;
  const prev = valueOnOrBefore(rows, daysBefore(now.date, 28));
  if (!prev || prev.date === now.date) return { now, prev: null, pct: null };
  return { now, prev, pct: (now.value / prev.value - 1) * 100 };
}

export const direction = (pct: number | null | undefined, eps = 0.1): Dir => (pct == null || Math.abs(pct) < eps ? "same" : pct > 0 ? "up" : "down");

/** Date the latest value took effect (start of the trailing run of equal values). */
export function since(rows: Pt[]) {
  let i = rows.length - 1;
  while (i > 0 && rows[i - 1].value === rows[i].value) i--;
  return rows[i]?.date;
}

/** Price growth factor between two dates from monthly annual-inflation prints, compounding each print's rate until the next one. */
export function priceGrowth(inflation: Pt[], from: string, to: string) {
  let f = 1;
  for (let i = 0; i < inflation.length; i++) {
    const start = inflation[i].date > from ? inflation[i].date : from;
    const next = inflation[i + 1]?.date ?? to;
    const end = next < to ? next : to;
    if (end <= start) continue;
    f *= Math.pow(1 + inflation[i].value / 100, (Date.parse(end) - Date.parse(start)) / (365.25 * DAY));
  }
  return f;
}
