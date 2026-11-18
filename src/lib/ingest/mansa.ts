import "server-only";
import { prisma } from "../db";
import { LUSE_SECURITIES } from "../data/securities";
import { num } from "./util";
import { UA } from "./luse";

/** Mansa Markets (mansamarkets.com) republishes LuSE session data daily and is reachable from cloud runners, unlike luse.co.zm which blocks them. */
const BASE = "https://www.mansamarkets.com";
const MON: Record<string, string> = { January: "01", February: "02", March: "03", April: "04", May: "05", June: "06", July: "07", August: "08", September: "09", October: "10", November: "11", December: "12" };

const get = (path: string) => fetch(BASE + path, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(30000) }).then((r) => { if (!r.ok) throw new Error(`mansa ${path}: HTTP ${r.status}`); return r.text(); });
const suf = (v: string | undefined, suffix: string | undefined) => (v == null ? null : parseFloat(v.replace(/,/g, "")) * ({ K: 1e3, M: 1e6, B: 1e9 }[suffix ?? ""] ?? 1));
const sessionDate = (s: string) => { const m = s.match(/on (?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day, (\d{1,2}) (\w+) (\d{4})/); return m ? `${m[3]}-${MON[m[2]]}-${m[1].padStart(2, "0")}` : null; };
const pct = (s: string) => num(s.replace("−", "-").replace("%", ""));
const volume = (s: string, label = "Volume") => { const m = s.match(new RegExp(label + "<\\/div><div[^>]*>([\\d,.]+)\\s*([KMB])\\b")) ?? s.match(new RegExp(label + "\\s*([\\d,.]+)\\s*([KMB])\\b")); return m ? suf(m[1], m[2]) : null; };

export type MansaStock = { symbol: string; close: number; pctChange: number };

/** Price + % change for every LuSE counter on the Zambia board page. The mover cards repeat symbols later in the HTML, so first occurrence wins. */
export function parseMansaBoard(home: string) {
  const date = sessionDate(home);
  const lasiM = home.match(/LASI Index (-?[\d.]+)% at ([\d,.]+) on/);
  const lasiM2 = home.match(/LASI Index\s*([\d,.]+)\s*[^\d+\-−]{0,10}([+\-−]?[\d.]+)%/);
  const capM = home.match(/Market [Cc]ap(?:italisation)?(?:\s*stood at)?[^0-9]{0,40}ZMW\s*([\d,.]+)\s*([BM])/);
  const stocks: MansaStock[] = [];
  const seen = new Set<string>();
  const row = /font-mono-dm[^>]*>([A-Z]{2,6})<\/div><div class="truncate[^>]*>([^<]+)<\/div>.*?>(ZK[\d,.]+)<\/div>.*?([+\-−]?\d+\.\d+%)/g;
  let m: RegExpExecArray | null;
  while ((m = row.exec(home))) {
    const symbol = m[1];
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    stocks.push({ symbol, close: parseFloat(m[3].replace(/[ZK,\s]/g, "")), pctChange: pct(m[4]) ?? 0 });
  }
  return {
    date,
    lasi: lasiM ? { value: num(lasiM[2]), pctChange: pct(lasiM[1]) } : lasiM2 ? { value: num(lasiM2[1]), pctChange: pct(lasiM2[2]) } : { value: null, pctChange: null },
    marketCap: capM ? suf(capM[1], capM[2]) : null,
    totalVolume: volume(home, "Total Volume"),
    summary: (() => { const t = home.replace(/<[^>]+>/g, " "); const i = t.indexOf("The Lusaka Securities Exchange"); return i > -1 ? t.slice(i, i + 700).split(".  ")[0].replace(/\s+/g, " ").trim() : null; })(),
    stocks,
  };
}

/** Volume for one counter from its ticker page, e.g. /zambia/cecz → "Volume 19.7K". */
export const mansaVolume = (ticker: string) => get(`/zambia/${ticker.toLowerCase()}`).then(volume).catch(() => null);

/** Pull the day's LuSE board from Mansa Markets and save it like a LuSE ingest (source: "mansa"). */
export async function ingestMansa() {
  const home = await get("/zambia");
  const p = parseMansaBoard(home);
  if (!p.date) throw new Error("mansa: no session date on the Zambia page");
  if (!p.stocks.length) throw new Error("mansa: no stock rows on the Zambia page");
  const date = new Date(p.date + "T00:00:00Z");

  const vols = new Map<string, number | null>();
  await Promise.all(p.stocks.map((s) => mansaVolume(s.symbol).then((v) => vols.set(s.symbol, v))));

  let rows = 0;
  for (const st of p.stocks) {
    const meta = LUSE_SECURITIES.find((m) => m.symbol === st.symbol);
    const sec = await prisma.security.upsert({
      where: { symbol: st.symbol },
      update: {},
      create: { symbol: st.symbol, name: meta?.name ?? st.symbol, sector: meta?.sector ?? "Other", board: meta?.board ?? "Main", currency: meta?.currency ?? "ZMW", listedYear: meta?.listedYear, description: meta?.description },
    });
    const data = { close: st.close, change: null as number | null, volume: vols.get(st.symbol) ?? null, source: "mansa" };
    await prisma.priceBar.upsert({ where: { securityId_date: { securityId: sec.id, date } }, update: data, create: { ...data, securityId: sec.id, date } });
    rows++;
  }
  if (p.lasi.value != null) {
    const d = { value: p.lasi.value, change: null, pctChange: p.lasi.pctChange, volume: p.totalVolume, marketCap: p.marketCap, source: "mansa" };
    await prisma.indexBar.upsert({ where: { index_date: { index: "LASI", date } }, update: d, create: { ...d, index: "LASI", date } });
  }
  if (p.summary) await prisma.marketSummary.upsert({ where: { date }, update: { text: p.summary }, create: { date, text: p.summary } });
  return { date: p.date, rows, lasi: p.lasi.value != null };
}
