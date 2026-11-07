import { prisma } from "../db";
import { median, P2P_BUY, P2P_SELL } from "../crypto-zm";

type Ad = { adv: { price: string; tradableQuantity?: string } };

async function binance(tradeType: "BUY" | "SELL") {
  const r = await fetch("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ fiat: "ZMW", asset: "USDT", tradeType, page: 1, rows: 10, payTypes: [], publisherType: null }),
  });
  if (!r.ok) throw new Error(`Binance P2P ${r.status}`);
  const j = (await r.json()) as { data?: Ad[] };
  return (j.data || []).map((d) => +d.adv.price).filter((x) => x > 0);
}

/** Snapshot the Binance P2P USDT/ZMW rate (median of the 10 best ads on each side), one row per day. */
export async function ingestP2P() {
  const [buy, sell] = await Promise.all([binance("BUY"), binance("SELL")]);
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const out: Record<string, number | null> = {};
  for (const [key, xs] of [[P2P_BUY, buy], [P2P_SELL, sell]] as const) {
    const v = median(xs);
    out[key] = v;
    if (v == null) continue;
    const note = `Binance P2P median of ${xs.length} best ads (${Math.min(...xs)}–${Math.max(...xs)})`;
    await prisma.macroRate.upsert({ where: { key_date: { key, date } }, update: { value: v, note }, create: { key, date, value: v, note } });
  }
  return out;
}
