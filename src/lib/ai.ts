import "server-only";
import { getQuotes, latestMacro, breadth, getAnnouncements } from "./market";
import { yieldCurve } from "./fixed-income";
import { brand } from "@/config/brand";

export type Msg = { role: "user" | "assistant" | "system"; content: string };

export async function marketContext() {
  const [q, m, c, s] = await Promise.all([getQuotes("EQUITY"), latestMacro(), yieldCurve(), getAnnouncements(8)]);
  const b = breadth(q);
  return [
    `Latest LuSE session: ${q[0]?.date ?? "n/a"}. Advances ${b.advances}, declines ${b.declines}, unchanged ${b.unchanged}.`,
    `Quotes (symbol close %chg value): ${q.map((x) => `${x.symbol} ${x.close} ${x.changePct?.toFixed(2) ?? "-"}% K${Math.round(x.value ?? 0)}`).join("; ")}`,
    `BoZ: MPR ${m.MPR?.value}%, inflation ${m.INFLATION?.value}%, interbank ${m.INTERBANK?.value}%, USD/ZMW ${m.USDZMW?.value}. Binance P2P USDT/ZMW: buy ${m.P2P_USDT_ZMW_BUY?.value ?? "n/a"}, sell ${m.P2P_USDT_ZMW_SELL?.value ?? "n/a"}.`,
    `GRZ yield curve: ${c.map((x) => `${x.tenor} ${x.yield}%`).join(", ")}.`,
    `Recent SENS: ${s.map((x) => x.title).join(" | ")}`,
    `LuSE fees: 1.375% per side (SEC 0.125%, LuSE 0.25%, broker 1%).`,
  ].join("\n");
}

export const SYSTEM = `You are the ${brand.name} research assistant for Zambian markets (Lusaka Securities Exchange equities, LASI, GRZ T-bills and bonds, Bank of Zambia macro data, and major cryptocurrencies). Answer clearly and concisely using the market data provided. Explain indicators, strategies and fixed-income maths. Never give personalised investment advice; remind users that past performance does not guarantee future results when discussing strategies. Quote currency as K (kwacha).`;

export function aiConfigured() { return !!process.env.AI_API_KEY; }

export async function complete(messages: Msg[], maxTokens = 900): Promise<string> {
  const base = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4o-mini", messages, temperature: 0.3, max_tokens: maxTokens }),
  });
  if (!r.ok) throw new Error(`AI provider error ${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "";
}

export async function completeJSON<T>(messages: Msg[], parse: (v: unknown) => T, maxTokens = 1200): Promise<T> {
  const base = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4o-mini", messages, temperature: 0, max_tokens: maxTokens, response_format: { type: "json_object" } }),
  });
  if (!r.ok) throw new Error(`AI provider error ${r.status}`);
  const j = await r.json();
  const txt: string = j.choices?.[0]?.message?.content ?? "";
  const body = txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1);
  return parse(JSON.parse(body));
}
