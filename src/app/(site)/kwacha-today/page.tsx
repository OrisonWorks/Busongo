import Link from "next/link";
import ListenButton from "@/components/ListenButton";
import ShareButton from "@/components/ShareButton";
import { brand } from "@/config/brand";
import { WA_CHANNEL_URL } from "@/lib/whatsapp";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PlainCalculators from "@/components/PlainCalculators";
import { GLOSSARY } from "@/components/Glossed";
import { cardSpeech, plainCards, plainFacts } from "@/lib/plain-facts";
import { getLocale } from "@/lib/i18n/server";
import { t, type Key } from "@/lib/i18n";
import { MESSAGES } from "@/lib/i18n/messages";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Kwacha Today", description: "The dollar, prices, government borrowing rates and the Bank of Zambia rate, explained in plain words and local languages." };

const ARROW = { up: "▲", down: "▼", same: "●" } as const;

export default async function Page() {
  const [l, f] = await Promise.all([getLocale(), plainFacts()]);
  const tt = (k: Key) => t(l, k);
  const cards = plainCards(f, l);
  const english = new Map(plainCards(f, "en").map((c) => [c.id, cardSpeech(c)]));
  const calcKeys = (Object.keys(MESSAGES.en) as Key[]).filter((k) => k.startsWith("calc."));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10" lang={l}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{tt("title")}</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted">{tt("subtitle")}</p>
          {f.updated && <p className="mt-1 text-sm text-muted">{t(l, "updated", { date: fmtDate(f.updated) })}</p>}
          <p className="mt-1 text-sm"><a href={`/lite${l === "en" ? "" : `?lang=${l}`}`} className="text-brand underline">{tt("lite")}</a>{" · "}<Link href="/kwacha-today/share" className="text-brand underline">{tt("shareKit")}</Link>{WA_CHANNEL_URL && <>{" · "}<a href={WA_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-brand underline">WhatsApp channel</a></>}</p>
        </div>
        <LanguageSwitcher value={l} label={tt("language")} />
      </div>
      {l !== "en" && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">{tt("draft")} <Link href="/contact" className="underline">→</Link></p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <section key={c.id} className="card flex flex-col p-5" aria-labelledby={`card-${c.id}`}>
            <h2 id={`card-${c.id}`} className="text-lg font-semibold">{c.title}</h2>
            <div className="num mt-1 text-4xl font-bold">{c.big}</div>
            <p className="mt-3 text-lg leading-relaxed">{c.line}</p>
            {c.month && <p className="mt-1 text-muted">{c.dir && <span aria-hidden="true">{ARROW[c.dir]} </span>}{c.month}</p>}
            <details className="mt-3">
              <summary className="cursor-pointer text-brand">{tt("whatMeans")}</summary>
              <p className="mt-2 leading-relaxed text-muted">{c.explain}</p>
            </details>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <ListenButton text={english.get(c.id) ?? cardSpeech(c)} label={tt("listen")} stopLabel={tt("stop")} note={tt("listenNote")} />
              <ShareButton label={tt("share")} file={`busongo-${c.id}.png`} image={`/kwacha-today/image/${c.id}${l === "en" ? "" : `?lang=${l}`}`} text={`${c.title}: ${c.line}${c.month ? ` ${c.month}` : ""}\n${brand.siteUrl}/kwacha-today`} />
            </div>
          </section>
        ))}
        {!cards.length && <p className="text-muted">{tt("noData")}</p>}
      </div>

      <h2 className="mt-12 text-2xl font-bold">{tt("calc.title")}</h2>
      <div className="mt-4">
        <PlainCalculators s={Object.fromEntries(calcKeys.map((k) => [k, MESSAGES[l]?.[k] ?? MESSAGES.en[k]]))} inflation={f.inflationSeries} today={today} tenors={f.tenors} wht={f.wht} fx={f.fx?.now.value ?? null} />
      </div>

      <h2 className="mt-12 text-2xl font-bold">{tt("glossary.title")}</h2>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {GLOSSARY.map((k) => (
          <div key={k} className="card p-4">
            <dt className="font-semibold">{t(l, `g.${k}.term` as Key)}</dt>
            <dd className="mt-1 leading-relaxed text-muted">{t(l, `g.${k}.def` as Key)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-sm text-muted">{tt("disclaimer")} {tt("source")}</p>
    </div>
  );
}
