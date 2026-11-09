import { prisma } from "../db";
import { num, dmy } from "./util";
import { LUSE_SECURITIES } from "../data/securities";

export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type Row = Record<string, string>;

const MARKET_DATA_URL = "https://www.luse.co.zm/trading/market-data/";

async function saveDebug(page: import("playwright").Page, attempt: number, detail: string) {
  const dir = process.env.LUSE_DEBUG_DIR;
  if (!dir) return;
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });
  const text = await page.innerText("body").catch(() => "");
  await writeFile(`${dir}/attempt-${attempt}.txt`, `${detail}\nurl: ${page.url()}\n\n${text.slice(0, 5000)}`);
  await page.screenshot({ path: `${dir}/attempt-${attempt}.png`, fullPage: true }).catch(() => {});
}

export async function scrapeLuse() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ userAgent: UA });
    for (let attempt = 1; ; attempt++) {
      const res = await page.goto(MARKET_DATA_URL, { waitUntil: "domcontentloaded", timeout: 90000 }).catch((e: Error) => e);
      const ok = !(res instanceof Error) && (await page.waitForSelector("table", { timeout: 60000 }).then(() => true, () => false));
      if (ok) break;
      const status = res instanceof Error ? res.message.split("\n")[0] : `HTTP ${res?.status()}`;
      const title = await page.title().catch(() => "");
      const detail = `LuSE: no price table (attempt ${attempt}, ${status}, title "${title}")`;
      await saveDebug(page, attempt, detail);
      if (attempt >= 2) throw new Error(detail);
      console.warn(detail + "; retrying");
      await page.waitForTimeout(15000);
    }
    const body = await page.innerText("body");
    const tables: Row[][] = await page.$$eval("table", (ts) =>
      ts.map((t) => {
        const heads = Array.from(t.querySelectorAll("th")).map((x) => (x as HTMLElement).innerText.trim());
        return Array.from(t.querySelectorAll("tbody tr"))
          .map((tr) => {
            const cells = Array.from(tr.querySelectorAll("td")).map((x) => (x as HTMLElement).innerText.trim());
            const o: Record<string, string> = {};
            heads.forEach((h, i) => (o[h] = cells[i] ?? ""));
            return o;
          })
          .filter((o) => Object.values(o).some((v) => v));
      }),
    );

    await page.goto("https://www.luse.co.zm/", { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(3000);
    const home = await page.innerText("body");
    const sensLinks: string[] = await page.$$eval("a", (as) =>
      as.filter((a) => /download/i.test((a as HTMLElement).innerText)).map((a) => (a as HTMLAnchorElement).href),
    );
    return { body, tables, home, sensLinks };
  } finally {
    await browser.close();
  }
}

export function parseLuse(s: Awaited<ReturnType<typeof scrapeLuse>>) {
  const dateM = s.body.match(/Market Data as of\s*\n?\s*(\d{1,2}\/\d{1,2}\/\d{4})/) || s.body.match(/LASI\s*\n\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
  const date = dateM ? dmy(dateM[1]) : null;
  if (!date) throw new Error("LuSE: could not find market date");
  const grab = (label: string) => {
    const m = s.body.match(new RegExp(label + "\\s*\\n\\s*([^\\n]+)"));
    return m ? m[1] : null;
  };
  const summaryM = s.body.match(/EQUITY MARKET\s*([\s\S]*?)Daily Stock Data/);
  const summary = summaryM ? summaryM[1].trim() : null;
  const capM = summary?.match(/capitali[sz]ation stood at K([\d,\.]+) including Shoprite[^K]*K([\d,\.]+) excluding/i);
  const lasi = {
    value: num(grab("Current Value")),
    change: num(grab("Change")),
    pctChange: num(grab("% Change")),
    trades: num(grab("Trades")),
    volume: num(grab("Volume Traded")),
    valueTraded: num(grab("Value Traded")),
    marketCap: capM ? num(capM[1]) : null,
    marketCapEx: capM ? num(capM[2]) : null,
  };
  const stockTable = s.tables.find((t) => t[0] && "Security" in t[0]) || [];
  const stocks = stockTable
    .map((r) => ({
      symbol: r["Security"]?.trim(),
      isin: r["ISIN code"]?.trim() || null,
      close: num(r["Closing Price (ZMW)"]),
      change: num(r["Price Change"]) ?? 0,
      trades: num(r["Trades"]) ?? 0,
      volume: num(r["Volume Traded"]) ?? 0,
      value: num(r["Value Traded (ZMW)"]) ?? 0,
      bidPrice: num(r["Best Bid Price"]),
      bidQty: num(r["Best Bid Quantity"]),
      askPrice: num(r["Best Ask Price"]),
      askQty: num(r["Best Ask Quantity"]),
    }))
    .filter((r) => r.symbol && r.close != null);
  const bondTable = s.tables.find((t) => t[0] && "Maturity Date" in t[0]) || [];
  const bonds = bondTable
    .map((r) => ({
      name: r["Name"],
      value: r["Value"] || null,
      interest: r["Interest"] || null,
      isin: r["ISIN"],
      tenorYears: num(r["Tenor (Years)"]),
      issueDate: dmy(r["Issue Date"] || ""),
      maturityDate: dmy(r["Maturity Date"] || ""),
      status: r["Status"] || null,
    }))
    .filter((b) => b.isin && b.name);

  const sens: { title: string; category: string | null; date: Date; url: string | null }[] = [];
  const sm = s.home.match(/SENS DOCUMENTS([\s\S]*?)VIEW ALL DOCUMENTS/);
  if (sm) {
    const blocks = sm[1].split(/\n\s*DOWNLOAD\s*\n?/).map((b) => b.trim()).filter(Boolean);
    blocks.forEach((b, i) => {
      const lines = b.split("\n").map((x) => x.trim()).filter(Boolean);
      const dl = lines.findIndex((l) => /^\d{1,2} \w+,? \d{4}$/.test(l));
      if (dl < 1) return;
      const d = new Date(lines[dl].replace(",", "") + " UTC");
      if (isNaN(+d)) return;
      sens.push({ title: lines[0], category: dl > 1 ? lines[1] : null, date: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), url: s.sensLinks[i] || null });
    });
  }
  if (!sens.length) {
    for (const url of s.sensLinks) {
      const f = decodeURIComponent(url.split("/").pop() || "");
      if (!/\.pdf$/i.test(f)) continue;
      const base = f.replace(/\.pdf$/i, "");
      const dm = base.match(/(\d{1,2})[.\-_](\d{1,2})[.\-_](\d{2,4})(?!.*\d{1,2}[.\-_]\d{1,2}[.\-_]\d{2,4})/);
      const um = url.match(/uploads\/(\d{4})\/(\d{2})\//);
      let d: Date | null = null;
      if (dm) d = new Date(Date.UTC(dm[3].length === 2 ? 2000 + +dm[3] : +dm[3], +dm[2] - 1, +dm[1]));
      else if (um) d = new Date(Date.UTC(+um[1], +um[2] - 1, 1));
      if (!d || isNaN(+d)) continue;
      const title = base.replace(dm ? dm[0] : "", "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
      sens.push({ title, category: /result|financial|interim|FY|HY/i.test(title) ? "Financial Results" : /dividend/i.test(title) ? "Dividend" : /cautionary/i.test(title) ? "Cautionary" : "Announcement", date: d, url });
    }
  }
  return { date, lasi, summary, stocks, bonds, sens };
}

const STOCK_HEADS = ["Security", "ISIN code", "Closing Price (ZMW)", "Price Change", "Trades", "Volume Traded", "Value Traded (ZMW)", "Best Bid Price", "Best Bid Quantity", "Best Ask Price", "Best Ask Quantity"];

/** Tables in text copied from the LuSE Market Data page (select all, copy): tab-separated rows under a header row. Falls back to space-separated share rows when the copy lost its tabs. */
export function tablesFromText(text: string): Record<string, string>[][] {
  const lines = text.replace(/\r/g, "").split("\n");
  const tables: Record<string, string>[][] = [];
  let heads: string[] | null = null;
  for (const line of lines) {
    const cells = line.split("\t").map((c) => c.trim());
    if (cells.length < 3) {
      heads = null;
      continue;
    }
    if (!heads || cells.includes("Security") || cells.includes("Maturity Date")) {
      heads = cells;
      tables.push([]);
      continue;
    }
    const h = heads;
    tables[tables.length - 1].push(Object.fromEntries(h.map((k, i) => [k, cells[i] ?? ""]).filter(([k]) => k)));
  }
  const out = tables.filter((t) => t.length);
  if (!out.some((t) => "Security" in t[0])) {
    const rows = lines
      .map((l) => l.trim().match(/^([A-Z][A-Z0-9-]{1,11})\s+((?:ZM|ZA)[A-Z0-9]{10})\s+(.*)$/))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => {
        const cells = [m[1], m[2], ...m[3].split(/\s+/)];
        return Object.fromEntries(STOCK_HEADS.map((k, i) => [k, cells[i] ?? ""]));
      });
    if (rows.length) out.push(rows);
  }
  return out;
}

/** Parses the LuSE Market Data page as pasted by an admin. */
export function parseLusePaste(text: string) {
  const p = parseLuse({ body: text.replace(/\r/g, ""), tables: tablesFromText(text), home: "", sensLinks: [] });
  if (!p.stocks.length) throw new Error("LuSE: no share prices found");
  return p;
}

export async function ingestLuse() {
  return saveLuse(parseLuse(await scrapeLuse()));
}

export async function ingestLusePaste(text: string) {
  return saveLuse(parseLusePaste(text));
}

async function saveLuse(p: ReturnType<typeof parseLuse>) {
  let rows = 0;
  for (const st of p.stocks) {
    const meta = LUSE_SECURITIES.find((m) => m.symbol === st.symbol);
    const sec = await prisma.security.upsert({
      where: { symbol: st.symbol },
      update: { isin: st.isin ?? undefined },
      create: {
        symbol: st.symbol,
        name: meta?.name ?? st.symbol,
        sector: meta?.sector ?? "Other",
        board: meta?.board ?? "Main",
        currency: meta?.currency ?? (st.symbol.endsWith("USD") ? "USD" : "ZMW"),
        isin: st.isin,
        listedYear: meta?.listedYear,
        description: meta?.description,
      },
    });
    const data = {
      close: st.close!,
      change: st.change,
      trades: st.trades,
      volume: st.volume,
      value: st.value,
      bidPrice: st.bidPrice,
      bidQty: st.bidQty,
      askPrice: st.askPrice,
      askQty: st.askQty,
      source: "luse",
    };
    await prisma.priceBar.upsert({
      where: { securityId_date: { securityId: sec.id, date: p.date } },
      update: data,
      create: { ...data, securityId: sec.id, date: p.date },
    });
    rows++;
  }
  if (p.lasi.value != null) {
    const d = {
      value: p.lasi.value,
      change: p.lasi.change,
      pctChange: p.lasi.pctChange,
      trades: p.lasi.trades,
      volume: p.lasi.volume,
      valueTraded: p.lasi.valueTraded,
      marketCap: p.lasi.marketCap,
      marketCapExShoprite: p.lasi.marketCapEx,
      source: "luse",
    };
    await prisma.indexBar.upsert({ where: { index_date: { index: "LASI", date: p.date } }, update: d, create: { ...d, index: "LASI", date: p.date } });
  }
  if (p.summary) await prisma.marketSummary.upsert({ where: { date: p.date }, update: { text: p.summary }, create: { date: p.date, text: p.summary } });
  for (const b of p.bonds) {
    await prisma.listedBond.upsert({ where: { isin: b.isin }, update: b, create: { ...b, kind: "corporate" } });
  }
  const secs = await prisma.security.findMany({ select: { id: true, symbol: true } });
  for (const a of p.sens) {
    const sym = secs.find((s) => new RegExp(`\\b${s.symbol.replace("USD", "").split("-")[0]}\\b`, "i").test(a.title));
    await prisma.announcement.upsert({
      where: { title_date: { title: a.title, date: a.date } },
      update: { url: a.url, category: a.category },
      create: { ...a, securityId: sym?.id },
    });
  }
  return { date: p.date, rows, lasi: p.lasi.value != null, bonds: p.bonds.length, sens: p.sens.length };
}
