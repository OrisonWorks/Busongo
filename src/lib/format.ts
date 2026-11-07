export const fmt = (v: number | null | undefined, d = 2) =>
  v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-ZM", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtInt = (v: number | null | undefined) => fmt(v, 0);
export const pct = (v: number | null | undefined, d = 2) => (v == null || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(d)}%`);
export const kwacha = (v: number | null | undefined, d = 2) => (v == null ? "—" : `K${fmt(v, d)}`);
export const compact = (v: number | null | undefined) =>
  v == null ? "—" : Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(v);
export const tone = (v: number | null | undefined) => (v == null || v === 0 ? "text-muted" : v > 0 ? "text-up" : "text-down");
export const fmtDate = (s: string | Date | null | undefined) =>
  !s ? "—" : new Date(typeof s === "string" && s.length === 10 ? s + "T00:00:00Z" : s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
export const ccy = (currency: string, v: number | null | undefined, d = 2) => (currency === "USD" ? (v == null ? "—" : `$${fmt(v, d)}`) : kwacha(v, d));
