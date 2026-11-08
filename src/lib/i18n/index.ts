import { fill } from "./fill";
import { MESSAGES, type Key } from "./messages";

export const LOCALES = [
  { code: "en", name: "English" },
  { code: "bem", name: "Ichibemba" },
  { code: "ny", name: "Chinyanja" },
  { code: "toi", name: "Chitonga" },
  { code: "loz", name: "Silozi" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];
export const LANG_COOKIE = "lang";
export const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.code === v);

/** Falls back to English for any string not yet translated. */
export const t = (locale: Locale, key: Key, vars?: Record<string, string | number>) => fill(MESSAGES[locale]?.[key] ?? MESSAGES.en[key], vars);
export type { Key };
