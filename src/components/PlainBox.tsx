import Link from "next/link";
import ListenButton from "./ListenButton";
import { cardSpeech, plainCards, plainFacts, type Topic } from "@/lib/plain-facts";
import { t } from "@/lib/i18n";

/** "In plain words" summary for analyst pages; English only so the pages stay statically cached. */
export default async function PlainBox({ topics }: { topics: Topic[] }) {
  const cards = plainCards(await plainFacts(), "en", topics);
  if (!cards.length) return null;
  return (
    <details className="card mb-4 p-4" open>
      <summary className="cursor-pointer text-sm font-semibold">{t("en", "plainWords")}</summary>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {cards.map((c) => <li key={c.id}><b className="text-fg">{c.title}:</b> {c.line} {c.month}</li>)}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <ListenButton text={cards.map(cardSpeech).join(". ")} label={t("en", "listen")} stopLabel={t("en", "stop")} />
        <Link href="/kwacha-today" className="text-sm text-brand hover:underline">{t("en", "more")} →</Link>
      </div>
    </details>
  );
}
