import Term from "./Term";
import { t, type Key, type Locale } from "@/lib/i18n";

export type GlossKey = "inflation" | "exchange-rate" | "tbill" | "bond" | "yield" | "policy-rate" | "lasi" | "stock-exchange" | "marketcap" | "pe" | "pb" | "divyield" | "roe" | "volume" | "bidask" | "volatility" | "drawdown" | "beta" | "sens" | "auction" | "yieldcurve" | "backtest";
export const GLOSSARY: GlossKey[] = ["inflation", "exchange-rate", "policy-rate", "tbill", "bond", "yield", "stock-exchange", "lasi"];

export default function Glossed({ k, locale = "en", children }: { k: GlossKey; locale?: Locale; children?: React.ReactNode }) {
  const term = t(locale, `g.${k}.term` as Key);
  return <Term title={term} def={t(locale, `g.${k}.def` as Key)}>{children ?? term}</Term>;
}
