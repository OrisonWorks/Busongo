import { prisma } from "../db";
import { fetchJson, utcDay } from "./util";

const B = "https://www.boz.zm";
type JA = { data: { id: string; attributes: Record<string, unknown> }[]; included?: { type: string; attributes: Record<string, unknown> }[]; links?: { next?: { href: string } } };

const val = (a: Record<string, unknown>, re: RegExp) => {
  const k = Object.keys(a).find((k) => re.test(k));
  return k ? (a[k] as string | null) : null;
};
const f = (x: unknown) => (x == null || x === "" ? null : Number(x));
const timeAttr = (s: string) => {
  const m = String(s).match(/datetime="([^"]+)"/) || String(s).match(/datetime=\\?"([^"\\]+)/);
  return m ? new Date(m[1]) : null;
};

async function paged(url: string, max = 100) {
  const out: JA[] = [];
  let next: string | undefined = url;
  for (let i = 0; next && i < max; i++) {
    const page: JA = await fetchJson<JA>(next);
    out.push(page);
    next = page.links?.next?.href;
  }
  return out;
}

export async function ingestTbills() {
  const pages = await paged(`${B}/jsonapi/node/tbills_auction_results?include=field_tbills_auction_results&sort=-field_tbills_auction_date&page[limit]=50`);
  let rows = 0;
  for (const pg of pages) {
    const byParent = new Map<string, Record<string, unknown>[]>();
    for (const inc of pg.included || []) {
      const pid = String(inc.attributes.parent_id);
      byParent.set(pid, [...(byParent.get(pid) || []), { ...inc.attributes, _type: inc.type }]);
    }
    for (const n of pg.data) {
      const a = n.attributes;
      if (!a.field_tbills_auction_date) continue;
      const date = utcDay(String(a.field_tbills_auction_date));
      for (const p of byParent.get(String(a.drupal_internal__nid)) || []) {
        const m = String(p._type).match(/(\d+)_days/);
        const y = f(val(p, /yield/));
        if (!m || y == null) continue;
        const tenorDays = +m[1];
        const d = { tenderNo: String(a.title), isin: val(p, /isin/), discountRate: f(val(p, /discount/)), yield: y };
        await prisma.tbillAuction.upsert({ where: { auctionDate_tenorDays: { auctionDate: date, tenorDays } }, update: d, create: { ...d, auctionDate: date, tenorDays } });
        rows++;
      }
    }
  }
  return rows;
}

export async function ingestBonds() {
  const pages = await paged(`${B}/jsonapi/node/bond_auction?include=field_auction_results&sort=-field_bond_auction_date&page[limit]=50`);
  let rows = 0;
  for (const pg of pages) {
    const byParent = new Map<string, Record<string, unknown>[]>();
    for (const inc of pg.included || []) {
      const pid = String(inc.attributes.parent_id);
      byParent.set(pid, [...(byParent.get(pid) || []), { ...inc.attributes, _type: inc.type }]);
    }
    for (const n of pg.data) {
      const a = n.attributes;
      if (!a.field_bond_auction_date) continue;
      const date = utcDay(String(a.field_bond_auction_date));
      for (const p of byParent.get(String(a.drupal_internal__nid)) || []) {
        const m = String(p._type).match(/(\d+)_year/);
        const y = f(val(p, /yield/));
        if (!m || y == null) continue;
        const tenorYears = +m[1];
        const d = { tenderNo: String(a.title), isin: val(p, /isin/), coupon: f(val(p, /coupon/)), yield: y };
        await prisma.bondAuction.upsert({ where: { auctionDate_tenorYears: { auctionDate: date, tenorYears } }, update: d, create: { ...d, auctionDate: date, tenorYears } });
        rows++;
      }
    }
  }
  return rows;
}

async function upsertRate(key: string, date: Date | null, value: number | null, note?: string | null) {
  if (!date || value == null || !Number.isFinite(value)) return 0;
  date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  await prisma.macroRate.upsert({ where: { key_date: { key, date } }, update: { value, note: note ?? undefined }, create: { key, date, value, note: note ?? undefined } });
  return 1;
}

type V = Record<string, string>;
export async function ingestMacro() {
  let rows = 0;
  const strip = (s?: string) => (s || "").replace(/<[^>]+>/g, "").trim();
  const mpr = await fetchJson<V[]>(`${B}/api/v1/views/monetary_policy_rates`);
  for (const r of mpr) rows += await upsertRate("MPR", timeAttr(r.monetary_policy_rate_date), f(r.monetary_policy_rate), strip(r.monetary_policy_rate_description));
  const inf = await fetchJson<V[]>(`${B}/api/v1/views/inflation_rates`);
  for (const r of inf) {
    const d = timeAttr(r.inflation_date);
    rows += await upsertRate("INFLATION", d, f(r.annual_overall_inflation_rate), r.inflation_description);
    rows += await upsertRate("INFLATION_FOOD", d, f(r.annual_food_inflation_rate));
    rows += await upsertRate("INFLATION_NONFOOD", d, f(r.annual_non_food_inflation_rate));
  }
  const ib = await fetchJson<V[]>(`${B}/api/v1/views/overnight_interbank_interest_rates?items_per_page=2000&page=0`);
  for (const r of ib) rows += await upsertRate("INTERBANK", timeAttr(r.overnight_interest_rate_date), f(r.overnight_interbank_interest_rate));
  try {
    const olf = await fetchJson<V[]>(`${B}/api/v1/views/overnight_lending_facility_rates?items_per_page=2000&page=0`);
    for (const r of olf) {
      const dk = Object.keys(r).find((k) => /date/.test(k));
      const vk = Object.keys(r).find((k) => /rate$/.test(k) && !/date/.test(k));
      if (dk && vk) rows += await upsertRate("OLF", timeAttr(r[dk]), f(r[vk]));
    }
  } catch {}
  const fx = await fetchJson<V[]>(`${B}/api/v1/views/boz_zmw_usd_daily_exchange_rates`);
  for (const r of fx) rows += await upsertRate("USDZMW", timeAttr(r.time), f(r.mid_rate));
  return rows;
}

export async function ingestBoz() {
  const tb = await ingestTbills();
  const bd = await ingestBonds();
  const mc = await ingestMacro();
  return { tbills: tb, bonds: bd, macro: mc };
}
