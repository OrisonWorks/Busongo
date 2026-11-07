import type { Cond, IndicatorId, Op, Operand } from "./engine/series";

export type ParsedStrategy = {
  entry: Cond[];
  exit: Cond[];
  entryJoin: "AND" | "OR";
  exitJoin: "AND" | "OR";
  stopLossPct?: number | null;
  takeProfitPct?: number | null;
  trailingStopPct?: number | null;
  maxHoldDays?: number | null;
  unparsed: string[];
};

const NUM = "(\\d+(?:\\.\\d+)?)";
const CMP = "(crosses above|crosses over|crossed above|cross above|crosses below|crosses under|crossed below|cross below|is above|is over|is below|is under|above|over|greater than|more than|higher than|exceeds|at least|>=|>|below|under|less than|lower than|at most|<=|<|drops below|falls below|rises above|moves above|goes above)";

function op(word: string): Op {
  const w = word.trim();
  if (/cross|rises above|moves above|goes above|drops below|falls below/.test(w)) return /above|over|rises|moves|goes/.test(w) ? "crossAbove" : "crossBelow";
  if (/at least|>=/.test(w)) return "gte";
  if (/at most|<=/.test(w)) return "lte";
  if (/above|over|greater|more|higher|exceeds|>/.test(w)) return "gt";
  return "lt";
}

const ma = (kind: string | undefined, period: number): Operand => ({ ind: (/ema|exponential/.test(kind || "") ? "ema" : "sma") as IndicatorId, period });
const n = (value: number): Operand => ({ ind: "number", value });
const c = (left: Operand, o: Op, right: Operand): Cond => ({ left, op: o, right });

/** Parse one clause such as "RSI(14) below 30" or "price crosses above the 50-day EMA". */
export function parseClause(raw: string): Cond | null {
  const s = raw.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
  let m: RegExpMatchArray | null;
  if (/golden cross/.test(s)) return c({ ind: "sma", period: 50 }, "crossAbove", { ind: "sma", period: 200 });
  if (/death cross/.test(s)) return c({ ind: "sma", period: 50 }, "crossBelow", { ind: "sma", period: 200 });
  if (/macd/.test(s)) {
    if (/bullish|turns? (up|positive)|(cross\w*|moves?|goes|rises) (above|over) (the )?signal/.test(s)) return c({ ind: "macd" }, "crossAbove", { ind: "macdSignal" });
    if (/bearish|turns? (down|negative)|(cross\w*|moves?|goes|drops|falls) (below|under) (the )?signal/.test(s)) return c({ ind: "macd" }, "crossBelow", { ind: "macdSignal" });
    if ((m = s.match(new RegExp(`macd(?: line)? ${CMP} (?:the )?(zero|0)`)))) return c({ ind: "macd" }, op(m[1]), n(0));
    if ((m = s.match(new RegExp(`macd(?: line)? ${CMP} (?:the )?signal`)))) return c({ ind: "macd" }, op(m[1]), { ind: "macdSignal" });
  }
  if ((m = s.match(new RegExp(`volume\\s+(?:is\\s+)?${CMP}\\s+(?:its\\s+|the\\s+)?(?:(\\d+)[-\\s]?day\\s+)?(?:average|avg)`)))) return c({ ind: "volume" }, op(m[1]), { ind: "volSma", period: m[2] ? +m[2] : 20 });
  if ((m = s.match(new RegExp(`rsi(?:\\s*\\(?\\s*(\\d+)\\s*\\)?)?(?:\\s*-?\\s*day)?\\s*(?:is\\s+)?${CMP}\\s*${NUM}`)))) return c({ ind: "rsi", period: m[1] ? +m[1] : 14 }, op(m[2]), n(+m[3]));
  if (/oversold/.test(s) && /rsi|oversold/.test(s)) return c({ ind: "rsi", period: 14 }, "lt", n(30));
  if (/overbought/.test(s)) return c({ ind: "rsi", period: 14 }, "gt", n(70));
  if ((m = s.match(new RegExp(`(\\d+)[-\\s]?(?:day|d|period)?\\s*(sma|ema|ma|moving average|exponential moving average)\\s+${CMP}\\s+(?:the\\s+)?(\\d+)[-\\s]?(?:day|d|period)?\\s*(sma|ema|ma|moving average|exponential moving average)`)))) return c(ma(m[2], +m[1]), op(m[3]), ma(m[5], +m[4]));
  if ((m = s.match(new RegExp(`${CMP}\\s+(?:its\\s+|the\\s+)?(\\d+)[-\\s]?(?:day|d|period|week)?\\s*(sma|ema|ma|moving average|exponential moving average|average)`)))) {
    const p = /week/.test(s.slice(m.index!, m.index! + m[0].length)) ? +m[2] * 5 : +m[2];
    return c({ ind: "close" }, op(m[1]), ma(m[3], p));
  }
  if ((m = s.match(/(?:new |hits? (?:a )?(?:new )?|makes? (?:a )?(?:new )?|at (?:a )?(?:new )?|breaks? (?:out )?(?:to |above )?(?:a |the )?)?(52[-\s]?week|(\d+)[-\s]?day|all[-\s]time) (high|low)/))) {
    const p = /52/.test(m[1]) ? 252 : /all/.test(m[1]) ? 1000 : +m[2];
    return m[3] === "high" ? c({ ind: "close" }, "gte", { ind: "highest", period: p }) : c({ ind: "close" }, "lte", { ind: "lowest", period: p });
  }
  if ((m = s.match(new RegExp(`${CMP}\\s+(?:the\\s+)?(lower|upper|middle|mid)\\s+bollinger`)))) return c({ ind: "close" }, op(m[1]), { ind: m[2] === "lower" ? "bbLower" : m[2] === "upper" ? "bbUpper" : "bbMid", period: 20 });
  if ((m = s.match(/(?:touch\w*|hits?|reach\w*) (?:the )?(lower|upper) bollinger/))) return m[1] === "lower" ? c({ ind: "close" }, "lte", { ind: "bbLower", period: 20 }) : c({ ind: "close" }, "gte", { ind: "bbUpper", period: 20 });
  if ((m = s.match(new RegExp(`adx(?:\\s*\\(?(\\d+)\\)?)?\\s*(?:is\\s+)?${CMP}\\s*${NUM}`)))) return c({ ind: "adx", period: m[1] ? +m[1] : 14 }, op(m[2]), n(+m[3]));
  if (/supertrend/.test(s)) {
    if ((m = s.match(new RegExp(`${CMP}\\s+(?:the\\s+)?supertrend`)))) return c({ ind: "close" }, op(m[1]), { ind: "supertrend", period: 10 });
    if (/bullish|turns? (green|up)|flips? (up|bullish)/.test(s)) return c({ ind: "close" }, "crossAbove", { ind: "supertrend", period: 10 });
    if (/bearish|turns? (red|down)|flips? (down|bearish)/.test(s)) return c({ ind: "close" }, "crossBelow", { ind: "supertrend", period: 10 });
  }
  if ((m = s.match(new RegExp(`(?:up|rises?|gains?|rallies|rallied) (?:more than |over |by )?${NUM}%(?: or more)? (?:in|over) (?:the )?(?:last |past )?(\\d+) (?:days|sessions|bars)`)))) return c({ ind: "roc", period: +m[2] }, "gt", n(+m[1]));
  if ((m = s.match(new RegExp(`(?:down|falls?|drops?|loses?|declines?) (?:more than |over |by )?${NUM}%(?: or more)? (?:in|over) (?:the )?(?:last |past )?(\\d+) (?:days|sessions|bars)`)))) return c({ ind: "roc", period: +m[2] }, "lt", n(-+m[1]));
  if ((m = s.match(new RegExp(`(?:price|close|it|stock|coin)\\s+(?:is\\s+)?${CMP}\\s+(?:k|zmw|\\$|usdt?)?\\s*${NUM}(?!\\s*(?:%|[-\\s]?day|d\\b|sma|ema))`)))) return c({ ind: "close" }, op(m[1]), n(+m[2]));
  return null;
}

function parseSide(text: string) {
  const t = text.replace(/^\s*(?:and\s+)?(?:buy|enter|go long|long|entry)\s*(?:when|if|once|on)?\s*/i, "").replace(/^\s*(?:sell|exit|close)\s*(?:when|if|once|on)?\s*/i, "");
  const join: "AND" | "OR" = /\bor\b/i.test(t) && !/\band\b/i.test(t) ? "OR" : "AND";
  const parts = t.split(/\s*(?:,|;|\band also\b|\band\b|\bor\b|\bwhile\b|\bwith\b|\bplus\b)\s*/i).map((x) => x.trim()).filter((x) => x.length > 1);
  const conds: Cond[] = [];
  const unparsed: string[] = [];
  for (const p of parts) {
    const r = parseClause(p);
    if (r) conds.push(r);
    else if (!/^(the|a|an|then|when|if|it|price)$/i.test(p)) unparsed.push(p);
  }
  return { conds, join, unparsed };
}

const RISK = [
  { k: "trailingStopPct", re: new RegExp(`(?:with |use |and )?(?:a )?${NUM}%\\s*trailing(?: stop(?:[-\\s]loss)?)?|trailing(?: stop(?:[-\\s]loss)?)?(?: of| at)?\\s*${NUM}%`, "i") },
  { k: "stopLossPct", re: new RegExp(`(?:with |use |and )?(?:a )?${NUM}%\\s*stop(?:[-\\s]?loss)?|stop(?:[-\\s]?loss)?(?: of| at)?\\s*${NUM}%|cut (?:losses|loss) (?:at )?${NUM}%`, "i") },
  { k: "takeProfitPct", re: new RegExp(`(?:with |use |and )?(?:a )?${NUM}%\\s*(?:take[-\\s]?profit|profit target|target)|(?:take[-\\s]?profit|profit target|target)(?: of| at)?\\s*${NUM}%`, "i") },
  { k: "maxHoldDays", re: /(?:hold(?:ing)?|exit after|sell after|close after|max(?:imum)? hold(?:ing)?(?: period)?)(?: for)?(?: at most| max(?:imum)?| up to| no more than)?\s*(\d+)\s*(?:days|sessions|bars)/i },
] as const;

/** Rule-based fallback that turns plain-English trading rules into backtester/scanner conditions. */
export function parseStrategyText(text: string): ParsedStrategy {
  let t = ` ${text.replace(/\s+/g, " ").trim()} `;
  const out: ParsedStrategy = { entry: [], exit: [], entryJoin: "AND", exitJoin: "OR", unparsed: [] };
  for (const { k, re } of RISK) {
    const m = t.match(re);
    if (m) {
      const v = +(m.slice(1).find((x) => x != null) as string);
      if (v > 0) (out as Record<string, unknown>)[k] = v;
      t = t.replace(m[0], " ");
    }
  }
  const split = t.match(/^(.*?)(?:[.;,]?\s*(?:and\s+|then\s+)?(?:sell|exit|close(?: the)? positions?|close out|take profits?)\s+(?:when|if|once|on|after)\b)(.*)$/i);
  const entryText = split ? split[1] : t;
  const exitText = split ? split[2] : "";
  const e = parseSide(entryText.replace(/[.]+\s*$/, ""));
  out.entry = e.conds;
  out.entryJoin = e.join;
  out.unparsed.push(...e.unparsed);
  if (exitText.trim()) {
    const x = parseSide(exitText.replace(/[.]+\s*$/, ""));
    out.exit = x.conds;
    out.exitJoin = /\band\b/i.test(exitText) && !/\bor\b/i.test(exitText) ? "AND" : "OR";
    out.unparsed.push(...x.unparsed);
  }
  out.unparsed = out.unparsed.filter((u) => !/^(?:with|and|then|the|a|stop|loss)$/i.test(u));
  return out;
}
