import "server-only";
import { cache } from "react";
import type { AssetClass } from "@prisma/client";
import { prisma } from "./db";

export type Bar = { date: string; open: number; high: number; low: number; close: number; volume: number; value: number; trades: number };

export type Quote = {
  symbol: string;
  name: string;
  sector: string | null;
  board: string | null;
  currency: string;
  assetClass: AssetClass;
  date: string | null;
  close: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  value: number | null;
  trades: number | null;
  bid: number | null;
  ask: number | null;
};

const day = (d: Date) => d.toISOString().slice(0, 10);

export const getQuotes = cache(async (assetClass: AssetClass = "EQUITY"): Promise<Quote[]> => {
  const secs = await prisma.security.findMany({
    where: { assetClass, active: true },
    include: { bars: { orderBy: { date: "desc" }, take: 2 } },
    orderBy: { symbol: "asc" },
  });
  return secs.map((s) => {
    const [b, p] = s.bars;
    const prevClose = p?.close ?? (b?.change != null ? b.close - b.change : null);
    const change = b ? (b.change ?? (prevClose != null ? b.close - prevClose : null)) : null;
    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      board: s.board,
      currency: s.currency,
      assetClass: s.assetClass,
      date: b ? day(b.date) : null,
      close: b?.close ?? null,
      prevClose,
      change,
      changePct: change != null && prevClose ? (change / prevClose) * 100 : null,
      volume: b?.volume ?? null,
      value: b?.value ?? null,
      trades: b?.trades ?? null,
      bid: b?.bidPrice ?? null,
      ask: b?.askPrice ?? null,
    };
  });
});

// LuSE publishes closes only, so missing OHLC is filled as close-to-close candles (open = previous close).
export function toBars(rows: { date: Date; open: number | null; high: number | null; low: number | null; close: number; volume: number | null; value: number | null; trades: number | null; change: number | null }[]): Bar[] {
  const out: Bar[] = [];
  let prev: number | null = null;
  for (const r of rows) {
    const open = r.open ?? prev ?? (r.change != null ? r.close - r.change : r.close);
    out.push({
      date: day(r.date),
      open,
      high: r.high ?? Math.max(open, r.close),
      low: r.low ?? Math.min(open, r.close),
      close: r.close,
      volume: r.volume ?? 0,
      value: r.value ?? 0,
      trades: r.trades ?? 0,
    });
    prev = r.close;
  }
  return out;
}

export const getSecurity = cache(async (symbol: string) =>
  prisma.security.findUnique({ where: { symbol: symbol.toUpperCase() } }),
);

export const getBars = cache(async (symbol: string, from?: Date | null): Promise<Bar[]> => {
  const s = await getSecurity(symbol);
  if (!s) return [];
  const rows = await prisma.priceBar.findMany({
    where: { securityId: s.id, ...(from ? { date: { gte: from } } : {}) },
    orderBy: { date: "asc" },
  });
  return toBars(rows);
});

export const getAllBars = cache(async (assetClass: AssetClass = "EQUITY", from?: Date | null) => {
  const rows = await prisma.priceBar.findMany({
    where: { security: { assetClass, active: true }, ...(from ? { date: { gte: from } } : {}) },
    orderBy: { date: "asc" },
    include: { security: { select: { symbol: true } } },
  });
  const by = new Map<string, typeof rows>();
  for (const r of rows) by.set(r.security.symbol, [...(by.get(r.security.symbol) || []), r]);
  return new Map([...by].map(([k, v]) => [k, toBars(v)]));
});

export const getIndex = cache(async (index = "LASI") => {
  const rows = await prisma.indexBar.findMany({ where: { index }, orderBy: { date: "asc" } });
  return rows.map((r) => ({ ...r, date: day(r.date) }));
});

export const getMacro = cache(async (key: string) => {
  const rows = await prisma.macroRate.findMany({ where: { key }, orderBy: { date: "asc" } });
  return rows.map((r) => ({ date: day(r.date), value: r.value, note: r.note }));
});

export const latestMacro = cache(async () => {
  const keys = ["MPR", "INFLATION", "INFLATION_FOOD", "INFLATION_NONFOOD", "INTERBANK", "OLF", "USDZMW", "P2P_USDT_ZMW_BUY", "P2P_USDT_ZMW_SELL"];
  const out: Record<string, { date: string; value: number } | undefined> = {};
  for (const k of keys) {
    const r = await prisma.macroRate.findFirst({ where: { key: k }, orderBy: { date: "desc" } });
    out[k] = r ? { date: day(r.date), value: r.value } : undefined;
  }
  return out;
});

export const getAnnouncements = cache(async (take = 50, symbol?: string) => {
  const rows = await prisma.announcement.findMany({
    where: symbol ? { security: { symbol } } : {},
    include: { security: { select: { symbol: true } } },
    orderBy: { date: "desc" },
    take,
  });
  return rows.map((r) => ({ ...r, date: day(r.date) }));
});

export function breadth(q: Quote[]) {
  const t = q.filter((x) => x.change != null);
  return {
    advances: t.filter((x) => (x.change as number) > 0).length,
    declines: t.filter((x) => (x.change as number) < 0).length,
    unchanged: t.filter((x) => x.change === 0).length,
    traded: q.filter((x) => (x.volume ?? 0) > 0).length,
    value: q.reduce((s, x) => s + (x.value ?? 0), 0),
    volume: q.reduce((s, x) => s + (x.volume ?? 0), 0),
    trades: q.reduce((s, x) => s + (x.trades ?? 0), 0),
  };
}

export const dataStatus = cache(async () => {
  const [eq, cr, firstEq] = await Promise.all([
    prisma.priceBar.findFirst({ where: { security: { assetClass: "EQUITY" } }, orderBy: { date: "desc" } }),
    prisma.priceBar.findFirst({ where: { security: { assetClass: "CRYPTO" } }, orderBy: { date: "desc" } }),
    prisma.priceBar.findFirst({ where: { security: { assetClass: "EQUITY" } }, orderBy: { date: "asc" } }),
  ]);
  const eqDays = await prisma.priceBar.groupBy({ by: ["date"], where: { security: { assetClass: "EQUITY" } } });
  return { equityLast: eq ? day(eq.date) : null, equityFirst: firstEq ? day(firstEq.date) : null, equitySessions: eqDays.length, cryptoLast: cr ? day(cr.date) : null };
});
