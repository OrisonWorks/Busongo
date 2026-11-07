export const num = (s: string | null | undefined): number | null => {
  if (s == null) return null;
  const t = String(s).replace(/[,\sK$]|ZMW/g, "").trim();
  if (!t || t === "-" || t === "–") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export const dmy = (s: string): Date | null => {
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
};

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const utcDay = (s: string) => new Date(s.slice(0, 10) + "T00:00:00Z");

export async function fetchJson<T = unknown>(url: string, tries = 3): Promise<T> {
  let err: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (research bot)", Accept: "application/json" } });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return (await r.json()) as T;
    } catch (e) {
      err = e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw err;
}
