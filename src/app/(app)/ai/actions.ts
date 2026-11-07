"use server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { consume } from "@/lib/usage";
import { aiConfigured, complete, completeJSON } from "@/lib/ai";
import { STRATEGY_PROMPT, EXPLAIN_PROMPT } from "@/lib/ai/prompts";
import { condSchema } from "@/lib/engine/schema";
import { parseStrategyText, type ParsedStrategy } from "@/lib/nl-strategy";
import { explainRules, type ExplainInput } from "@/lib/explain";

const pctOpt = z.number().positive().max(10000).nullable().optional();
const aiStrategy = z.object({
  entry: z.array(condSchema).max(10), exit: z.array(condSchema).max(10).default([]),
  entryJoin: z.enum(["AND", "OR"]).default("AND"), exitJoin: z.enum(["AND", "OR"]).default("OR"),
  stopLossPct: pctOpt, takeProfitPct: pctOpt, trailingStopPct: pctOpt, maxHoldDays: z.number().int().positive().nullable().optional(), notes: z.string().nullable().optional(),
});

export type DescribeResult = { error?: string; strategy?: ParsedStrategy & { notes?: string | null }; source?: "ai" | "rules" };

/** Turn plain-English rules into backtester/scanner conditions. Uses the AI provider when configured, otherwise the rule-based parser. */
export async function describeStrategy(text: string): Promise<DescribeResult> {
  if (typeof text !== "string" || !text.trim() || text.length > 1000) return { error: "Describe your rules in up to 1000 characters." };
  const user = await getUser();
  if (aiConfigured() && user) {
    const u = await consume(user, "aiMessages");
    if (u.ok) {
      try {
        const s = await completeJSON([{ role: "system", content: STRATEGY_PROMPT }, { role: "user", content: text }], (v) => aiStrategy.parse(v), 900);
        if (s.entry.length) return { strategy: { ...s, unparsed: [] }, source: "ai" };
      } catch (e) {
        console.error("describeStrategy AI fallback:", String(e).slice(0, 200));
      }
    }
  }
  const r = parseStrategyText(text);
  if (!r.entry.length && !r.exit.length) return { error: "Couldn't turn that into rules. Try something like “buy when RSI(14) is below 30 and price is above the 200-day SMA; sell when RSI is above 70 with a 5% stop loss”." };
  return { strategy: r, source: "rules" };
}

const explainSchema = z.object({ metrics: z.record(z.string(), z.number().nullable()), warnings: z.array(z.string()).max(20).optional(), perSymbol: z.array(z.object({ symbol: z.string(), trades: z.number(), pnl: z.number(), winRate: z.number().nullable() })).max(50).optional() });

export async function explainBacktest(raw: ExplainInput): Promise<{ points?: string[]; text?: string; source?: "ai" | "rules"; error?: string }> {
  const p = explainSchema.safeParse(raw);
  if (!p.success) return { error: "Nothing to explain yet." };
  const user = await getUser();
  if (aiConfigured() && user && p.data.metrics.trades) {
    const u = await consume(user, "aiMessages");
    if (u.ok) {
      try {
        const facts = explainRules(p.data).join("\n");
        const text = await complete([{ role: "system", content: EXPLAIN_PROMPT }, { role: "user", content: `Metrics: ${JSON.stringify(p.data.metrics)}\nPer symbol: ${JSON.stringify(p.data.perSymbol ?? [])}\nWarnings: ${(p.data.warnings ?? []).join(" | ")}\nComputed observations:\n${facts}` }], 500);
        if (text.trim()) return { text: text.trim(), source: "ai" };
      } catch (e) {
        console.error("explainBacktest AI fallback:", String(e).slice(0, 200));
      }
    }
  }
  return { points: explainRules(p.data), source: "rules" };
}
