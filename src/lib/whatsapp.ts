import "server-only";
import { cardSpeech, plainCards, type Facts, type Topic } from "@/lib/plain-facts";
import { t, type Locale } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { brand } from "@/config/brand";

/** The whole day's Kwacha Today as one WhatsApp message (plain text — works on every phone). */
export function kwachaTodayMessage(f: Facts, l: Locale): string {
  const cards = plainCards(f, l);
  const lines = [`*${t(l, "title")} — ${brand.name}*`];
  if (f.updated) lines.push(`_${t(l, "updated", { date: fmtDate(f.updated) })}_`);
  for (const c of cards) lines.push("", `*${c.title}: ${c.big}*`, c.line, ...(c.month ? [`_${c.month}_`] : []));
  lines.push("", `_${t(l, "disclaimer")}_`, "", `${brand.siteUrl}/lite${l === "en" ? "" : `?lang=${l}`}`);
  return lines.join("\n");
}

export const waLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** The public channel CTA is only shown once a real WhatsApp channel/number is configured. */
export const WA_CHANNEL_URL = process.env.NEXT_PUBLIC_WA_CHANNEL_URL || "";
