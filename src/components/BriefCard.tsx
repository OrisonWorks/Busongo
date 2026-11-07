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
    </section>
  );
}
