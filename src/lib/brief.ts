import "server-only";
import { prisma } from "./db";
import { breadth, getIndex, getQuotes, latestMacro } from "./market";
import { aiConfigured, complete } from "./ai";
import { BRIEF_PROMPT } from "./ai/prompts";

const f = (v: number | null | undefined, d = 2) => (v == null ? "n/a" : v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }));
const sp = (v: number | null | undefined) => (v == null ? "n/a" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`);

export async function briefFacts() {
  const [eq, cr, lasi, m, lastAuction] = await Promise.all([getQuotes("EQUITY"), getQuotes("CRYPTO"), getIndex(), latestMacro(), prisma.tbillAuction.findFirst({ orderBy: { auctionDate: "desc" } })]);
  const tbills = lastAuction ? await prisma.tbillAuction.findMany({ where: { auctionDate: lastAuction.auctionDate }, orderBy: { tenorDays: "asc" } }) : [];
  const moved = eq.filter((q) => q.changePct != null && q.changePct !== 0).sort((a, b) => (b.changePct as number) - (a.changePct as number));
  return {
    date: eq.reduce<string | null>((d, q) => (q.date && (!d || q.date > d) ? q.date : d), null) ?? new Date().toISOString().slice(0, 10),
    lasi: lasi.at(-1) ?? null,
    breadth: breadth(eq),
    turnover: eq.reduce((s, q) => s + (q.value ?? 0), 0),
    gainers: moved.filter((q) => (q.changePct as number) > 0).slice(0, 3),
    losers: moved.filter((q) => (q.changePct as number) < 0).reverse().slice(0, 3),
    mostTraded: [...eq].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 3).filter((q) => (q.value ?? 0) > 0),
    macro: m,
    tbills: tbills.map((t) => ({ tenorDays: t.tenorDays, yield: t.yield })),
    tbillDate: lastAuction?.auctionDate.toISOString().slice(0, 10) ?? null,
    crypto: cr.filter((q) => ["BTC", "ETH", "SOL", "BNB"].includes(q.symbol)).slice(0, 4),
  };
}
export type BriefFacts = Awaited<ReturnType<typeof briefFacts>>;

export function templateBrief(x: BriefFacts) {
  const p1 = `On ${x.date} the LASI ${x.lasi ? `closed at ${f(x.lasi.value)} (${sp(x.lasi.pctChange)})` : "was unavailable"}. ${x.breadth.advances} stocks rose, ${x.breadth.declines} fell and ${x.breadth.unchanged} were unchanged, with ${x.breadth.traded} counters trading.`;
  const p2 = [
    x.gainers.length ? `Top gainers: ${x.gainers.map((q) => `${q.symbol} ${sp(q.changePct)}`).join(", ")}.` : "",
    x.losers.length ? `Biggest decliners: ${x.losers.map((q) => `${q.symbol} ${sp(q.changePct)}`).join(", ")}.` : "",
    `Total turnover was K${f(x.turnover, 0)}${x.mostTraded.length ? `, led by ${x.mostTraded.map((q) => `${q.symbol} (K${f(q.value, 0)})`).join(", ")}` : ""}.`,
  ].filter(Boolean).join(" ");
  const m = x.macro;
  const p3 = `${x.tbills.length ? `At the ${x.tbillDate} T-bill auction, yields were ${x.tbills.map((t) => `${t.tenorDays}-day ${f(t.yield)}%`).join(", ")}. ` : ""}The BoZ policy rate stands at ${f(m.MPR?.value)}%, annual inflation at ${f(m.INFLATION?.value, 1)}% and the kwacha at K${f(m.USDZMW?.value, 4)} per US dollar.`;
  const p2p = m.P2P_USDT_ZMW_BUY && m.P2P_USDT_ZMW_SELL && m.USDZMW ? (m.P2P_USDT_ZMW_BUY.value + m.P2P_USDT_ZMW_SELL.value) / 2 : null;
  const p4 = x.crypto.length ? `In crypto, ${x.crypto.map((q) => `${q.symbol} ${sp(q.changePct)} at $${f(q.close)}`).join(", ")}.${p2p && m.USDZMW ? ` On Binance P2P, USDT changed hands at about K${f(p2p)}, ${sp((p2p / m.USDZMW.value - 1) * 100)} versus the official rate.` : ""}` : "";
  return [p1, p2, p3, p4].filter(Boolean).join("\n\n");
}

/** Build and store the daily brief. Uses AI when configured, otherwise a factual template. */
export async function generateBrief() {
  const facts = await briefFacts();
  let content = templateBrief(facts);
  let source = "template";
  if (aiConfigured()) {
    try {
      const t = (await complete([{ role: "system", content: BRIEF_PROMPT }, { role: "user", content: `Facts:\n${content}` }], 500)).trim();
      if (t.length > 100) { content = t; source = "ai"; }
    } catch (e) {
      console.error("brief AI", e);
    }
  }
  const date = new Date(facts.date + "T00:00:00Z");
  await prisma.dailyBrief.upsert({ where: { date }, update: { content, source }, create: { date, content, source } });
  return { date: facts.date, source, chars: content.length };
}

export const latestBrief = () => prisma.dailyBrief.findFirst({ orderBy: { date: "desc" } });
