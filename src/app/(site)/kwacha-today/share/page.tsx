import CopyButton from "@/components/CopyButton";
import { plainCards, plainFacts } from "@/lib/plain-facts";
import { kwachaTodayMessage, waLink } from "@/lib/whatsapp";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Share Kwacha Today", description: "Forward today's Zambian money figures on WhatsApp — pictures and a ready-made message." };

export default async function Page() {
  const [l, f] = await Promise.all([getLocale(), plainFacts()]);
  const cards = plainCards(f, l);
  const msg = kwachaTodayMessage(f, l);
  const q = l === "en" ? "" : `?lang=${l}`;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10" lang={l}>
      <h1 className="text-3xl font-bold">{t(l, "shareKit.title")}</h1>
      <p className="mt-2 text-muted">{t(l, "shareKit.subtitle")}</p>
      {f.updated && <p className="mt-1 text-sm text-muted">{t(l, "updated", { date: fmtDate(f.updated) })}</p>}

      <div className="card mt-6 p-5">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">{msg}</pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={msg} label={t(l, "shareKit.copy")} done={t(l, "shareKit.copied")} />
          <a href={waLink(msg)} target="_blank" rel="noopener noreferrer" className="btn btn-primary px-3 py-1.5 text-xs">{t(l, "share")}</a>
        </div>
      </div>

      <h2 className="mt-8 text-xl font-bold">{t(l, "shareKit.images")}</h2>
      <p className="mt-1 text-sm text-muted">{t(l, "shareKit.imagesHint")}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <figure key={c.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain downloadable card image */}
            <img src={`/kwacha-today/image/${c.id}${q}`} alt={c.title} className="w-full rounded-xl border border-line" />
            <figcaption className="mt-1 text-xs text-muted">{c.title}</figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted"><Link href="/kwacha-today" className="text-brand underline">← {t(l, "title")}</Link></p>
    </div>
  );
}
