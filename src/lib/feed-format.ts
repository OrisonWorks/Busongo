export type Row = Record<string, string | number | null>;

const cell = (v: string | number | null | undefined) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(columns: string[], rows: Row[]) {
  return [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
}

/** Long rows (one per date and key) into wide rows (one per date, a column per key). */
export function pivot<T>(rows: T[], date: (r: T) => string, key: (r: T) => string, value: (r: T) => number): Row[] {
  const by = new Map<string, Row>();
  for (const r of rows) {
    const d = date(r);
    const row = by.get(d) ?? { date: d };
    row[key(r)] = value(r);
    by.set(d, row);
  }
  return [...by.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
