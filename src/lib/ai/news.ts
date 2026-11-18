import "server-only";

/** Zambian-market headlines via Gemini + Google Search grounding. Qualitative only by design: the model is told never to emit prices, rates or index levels — every number on Busongo comes from the database. */
export type NewsItem = { headline: string; source: string; url: string; date: string };

const PROMPT = `You are a news curator for a Zambian financial research site. Using Google Search, find the 3 most recent (last 7 days), verifiable headlines about the Lusaka Securities Exchange, Bank of Zambia, or the Zambian economy, preferring these outlets: boz.zm, luse.co.zm, Lusaka Times, Zambia Daily Mail, News Diggers, Zambia Monitor, ZambiaInvest, Reuters Africa.
Rules:
- Headlines and summaries must be QUALITATIVE: never include index levels, share prices, exchange rates, yields, percentages or any other numbers — those come from our own database.
- Every item needs a real, working source URL and its publication date.
Return ONLY a JSON array, at most 3 items:
[{"headline":"...","source":"...","url":"https://...","date":"YYYY-MM-DD"}]`;

export const newsConfigured = () => !!process.env.GEMINI_API_KEY;

export async function fetchZambiaNews(): Promise<NewsItem[]> {
  if (!newsConfigured()) return [];
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`gemini news: HTTP ${res.status}`);
  const j = await res.json();
  const text: string = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x) => x && typeof x.headline === "string" && typeof x.url === "string" && /^https?:\/\//.test(x.url))
    .slice(0, 3)
    .map((x) => ({ headline: String(x.headline).slice(0, 300), source: String(x.source ?? "").slice(0, 80), url: x.url, date: /^\d{4}-\d{2}-\d{2}/.test(x.date) ? x.date.slice(0, 10) : "" }));
}
