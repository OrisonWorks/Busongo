import { latestBrief } from "@/lib/brief";
import { fmtDate } from "@/lib/format";

export default async function BriefCard({ className = "" }: { className?: string }) {
  const b = await latestBrief();
  if (!b) return null;
  return (
    <section className={`card p-4 ${className}`} aria-labelledby="brief-title">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="brief-title" className="text-sm font-semibold">Daily market brief · {fmtDate(b.date)}</h2>
        <span className="text-[11px] text-muted">{b.source === "ai" ? "AI-written from the day's data" : "Generated from the day's data"}</span>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-muted">{b.content.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
      {Array.isArray(b.news) && (b.news as { headline: string; source: string; url: string; date: string }[]).length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">In the news</div>
          <ul className="space-y-1 text-sm">
            {(b.news as { headline: string; source: string; url: string; date: string }[]).map((n, i) => (
              <li key={i}><a href={n.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{n.headline}</a>{n.source && <span className="text-muted"> — {n.source}{n.date ? `, ${n.date}` : ""}</span>}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
