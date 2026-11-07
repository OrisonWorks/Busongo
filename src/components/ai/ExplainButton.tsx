"use client";
import { useState, useTransition } from "react";
import { explainBacktest } from "@/app/(app)/ai/actions";
import type { ExplainInput } from "@/lib/explain";

export default function ExplainButton({ input }: { input: ExplainInput }) {
  const [out, setOut] = useState<Awaited<ReturnType<typeof explainBacktest>> | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">What do these results mean?</span>
        <button className="btn btn-ghost" disabled={pending} onClick={() => start(async () => setOut(await explainBacktest(input)))}>{pending ? "Explaining…" : out ? "Explain again" : "Explain my backtest"}</button>
      </div>
      {out?.error && <p className="mt-2 text-sm text-down">{out.error}</p>}
      {out?.points && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{out.points.map((p) => <li key={p}>{p}</li>)}</ul>}
      {out?.text && <div className="mt-3 whitespace-pre-line text-sm text-muted">{out.text}</div>}
      {out?.source && <p className="mt-2 text-[11px] text-muted">{out.source === "ai" ? "Written by AI from your metrics." : "Generated from your metrics."} Not investment advice.</p>}
    </div>
  );
}
