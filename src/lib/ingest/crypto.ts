import { prisma } from "../db";
import { CRYPTO_SYMBOLS } from "../data/securities";
import { fetchJson } from "./util";

type K = [number, string, string, string, string, string, number, string, number];

export async function ingestCrypto(sinceDays = 365 * 4) {
  let rows = 0;
  for (const c of CRYPTO_SYMBOLS) {
    const sec = await prisma.security.upsert({
      where: { symbol: c.symbol },
      update: {},
      create: { symbol: c.symbol, name: c.name, sector: "Crypto", currency: "USD", assetClass: "CRYPTO", board: "Crypto" },
    });
    const lastBar = await prisma.priceBar.findFirst({ where: { securityId: sec.id }, orderBy: { date: "desc" } });
    let start = lastBar ? +lastBar.date - 3 * 86400000 : Date.now() - sinceDays * 86400000;
    for (let guard = 0; guard < 10; guard++) {
      const ks = await fetchJson<K[]>(`https://data-api.binance.vision/api/v3/klines?symbol=${c.pair}&interval=1d&limit=1000&startTime=${start}`);
      if (!ks.length) break;
      const data = ks.map((k) => ({
        securityId: sec.id,
        date: new Date(k[0]),
        open: +k[1],
        high: +k[2],
        low: +k[3],
        close: +k[4],
        volume: +k[5],
        value: +k[7],
        trades: k[8],
        source: "binance",
      }));
      await prisma.$transaction(
        data.map((d, i) =>
          prisma.priceBar.upsert({
            where: { securityId_date: { securityId: sec.id, date: d.date } },
            update: { ...d, change: i > 0 ? d.close - data[i - 1].close : undefined },
            create: { ...d, change: i > 0 ? d.close - data[i - 1].close : null },
          }),
        ),
      );
      rows += data.length;
      if (ks.length < 1000) break;
      start = ks[ks.length - 1][0] + 86400000;
    }
  }
  return rows;
}
