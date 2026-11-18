import "server-only";
import { prisma } from "../db";
import { LUSE_SECURITIES } from "../data/securities";
import { num } from "./util";
import { UA, matchSecurity } from "./luse";

/** Mansa Markets (mansamarkets.com) republishes LuSE session data daily and is reachable from cloud runners, unlike luse.co.zm which blocks them. */
const BASE = "https://www.mansamarkets.com";
const MON: Record<string, string> = {};
for (const [i, m] of ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].entries()) { MON[m] = String(i + 1).padStart(2, "0"); MON[m.slice(0, 3)] = MON[m]; }

const get = (path: string) => fetch(BASE + path, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(30000) }).then((r) => { if (!r.ok) throw new Error(`mansa ${path}: HTTP ${r.status}`); return r.text(); });
const suf = (v: string | undefined, suffix: string | undefined) => (v == null ? null : parseFloat(v.replace(/,/g, "")) * ({ K: 1e3, M: 1e6, B: 1e9 }[suffix ?? ""] ?? 1));
const sessionDate = (s: string) => { const m = s.match(/on (?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day, (\d{1,2}) (\w+) (\d{4})/); return m ? `${m[3]}-${MON[m[2]]}-${m[1].padStart(2, "0")}` : null; };
const pct = (s: string) => num(s.replace("−", "-").replace("%", ""));
export const volume = (s: string, label = "Volume") => {
  // Label and value sit in sibling tags (</div><div> or </span><span>) or plain text; the suffix is optional (e.g. "4" shares).
  const m = s.match(new RegExp(label + "(?:</\\w+>\\s*<\\w+[^>]*>|\\s+)\\s*([\\d,.]+)\\s*([KMB])?\\b"));
  return m ? suf(m[1], m[2]) : null;
};

export type MansaStock = { symbol: string; close: number; pctChange: number | null };

/** Mansa uses short tickers where LuSE uses longer codes. */
const ALIAS: Record<string, string> = { REIZ: "REIZUSD", ZCCM: "ZCCM-IH" };
/** Dividend-calendar URL slugs that differ from board tickers or securities whose names start with a generic word. */
const SLUG_ALIAS: Record<string, string> = { zanaco: "ZNCO" };

/** Price + % change for every LuSE counter on the Zambia board page. The mover cards repeat symbols later in the HTML, so first occurrence wins. */
export function parseMansaBoard(home: string) {
  const date = sessionDate(home);
  const lasiM = home.match(/LASI Index (-?[\d.]+)% at ([\d,.]+) on/);
  const lasiM2 = home.match(/LASI Index\s*([\d,.]+)\s*[^\d+\-−]{0,10}([+\-−]?[\d.]+)%/);
  const capM = home.match(/Market [Cc]ap(?:italisation)?(?:\s*stood at)?[^0-9]{0,40}ZMW\s*([\d,.]+)\s*([BM])/);
  const stocks: MansaStock[] = [];
  // Tight per-row structure so a counter with no % badge ("—") can't swallow the next row's value.
  const row = /font-mono-dm[^>]*>([A-Z]{2,6})<\/div><div class="truncate[^>]*>([^<]+)<\/div><\/div><div class="flex-shrink-0 text-right"><div class="font-mono-dm[^>]*>(ZK[\d,.]+)<\/div><span[^>]*>([^<]*)<\/span>/g;
  let m: RegExpExecArray | null;
  const bySymbol = new Map<string, MansaStock>();
  while ((m = row.exec(home))) {
    const symbol = m[1];
    const p = m[4].match(/[+\-−]?\d+\.\d+%/);
    const cur = bySymbol.get(symbol);
    // The board sometimes shows "—" while the mover cards carry the real signed % — prefer a numeric one.
    if (cur && cur.pctChange != null) continue;
    bySymbol.set(symbol, { symbol, close: parseFloat(m[3].replace(/[ZK,\s]/g, "")), pctChange: p ? pct(p[0]) : null });
  }
  stocks.push(...bySymbol.values());
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
    const symbol = ALIAS[st.symbol] ?? st.symbol;
    const meta = LUSE_SECURITIES.find((m) => m.symbol === symbol);
    const sec = await prisma.security.upsert({
      where: { symbol },
      update: {},
      create: { symbol, name: meta?.name ?? symbol, sector: meta?.sector ?? "Other", board: meta?.board ?? "Main", currency: meta?.currency ?? "ZMW", listedYear: meta?.listedYear, description: meta?.description },
    });
    // Absolute change derived from the reported close and % change (Mansa gives no absolute figure).
    const change = st.pctChange == null ? null : st.close - st.close / (1 + st.pctChange / 100);
    const data = { close: st.close, change, volume: vols.get(st.symbol) ?? null, source: "mansa" };
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

const DMY = (s: string | undefined) => { const m = s?.match(/(\d{1,2}) (\w+) (\d{4})/); return m && MON[m[2]] ? new Date(`${m[3]}-${MON[m[2]]}-${m[1].padStart(2, "0")}T00:00:00Z`) : null; };

export type MansaDividend = { name: string; slug: string; dps: number; type: string; fy: string; exDate: Date | null; payDate: Date | null; yieldPct: number | null; status: string };

/** Rows of the Zambia dividend calendar table on Mansa Markets. */
export function parseMansaDividends(html: string): MansaDividend[] {
  const rows: MansaDividend[] = [];
  const tr = /<tr class="border-b[^"]*"><td class="px-3 py-3"><span[^>]*><a[^>]*href="\/zambia\/([a-z]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/tr>/g;
  let m: RegExpExecArray | null;
  while ((m = tr.exec(html))) {
    const cells = [...m[0].matchAll(/<td class="px-3 py-3[^"]*"[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, " ").replace(/<!-- -->/g, "").replace(/\s+/g, " ").trim());
    if (cells.length < 10) continue;
    const dps = cells[1].match(/ZMW\s*([\d,.]+)/);
    const y = cells[8].match(/([\d.]+)%/);
    rows.push({
      name: m[2].trim(), slug: m[1],
      dps: dps ? parseFloat(dps[1]) : NaN, type: cells[3], fy: cells[4],
      exDate: DMY(cells[5]), payDate: DMY(cells[7]),
      yieldPct: y ? parseFloat(y[1]) : null, status: cells[9],
    });
  }
  return rows;
}

/** File Mansa's dividend calendar into the corporate-actions tracker. */
export async function ingestMansaDividends() {
  const html = await get("/dividends/zambia");
  const rows = parseMansaDividends(html);
  const secs = await prisma.security.findMany({ select: { id: true, symbol: true, name: true } });
  let saved = 0; const unmatched: string[] = [];
  for (const r of rows) {
    if (!isFinite(r.dps)) continue;
    const sec = (SLUG_ALIAS[r.slug] && secs.find((x) => x.symbol === SLUG_ALIAS[r.slug])) || matchSecurity(`${r.name} ${r.slug}`, secs);
    if (!sec) { unmatched.push(r.name); continue; }
    const data = { exDate: r.exDate ?? undefined, payDate: r.payDate ?? undefined, amount: r.dps, notes: `${r.type} ${r.fy}${r.yieldPct != null ? ` · yield ≈${r.yieldPct}%` : ""} · ${r.status}`, source: "mansa" };
    // Dedupe on security+ex-date+amount+fiscal year (ex-date null-safe so a TBD row can't match a dated one). payDate is left out so a newly-confirmed date updates the same row; fy (inside notes) keeps equal-amount dividends of different years distinct.
    const existing = await prisma.corporateAction.findFirst({ where: { securityId: sec.id, type: "DIVIDEND", exDate: r.exDate, amount: r.dps, notes: { contains: r.fy } } });
    if (existing) await prisma.corporateAction.update({ where: { id: existing.id }, data });
    else await prisma.corporateAction.create({ data: { ...data, securityId: sec.id, type: "DIVIDEND" } });
    saved++;
  }
  return { dividends: rows.length, saved, unmatched };
}
