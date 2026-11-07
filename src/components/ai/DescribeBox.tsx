"use client";
import { useState, useTransition } from "react";
import { describeStrategy, type DescribeResult } from "@/app/(app)/ai/actions";

type S = NonNullable<DescribeResult["strategy"]>;

export default function DescribeBox({ onApply, placeholder, mode = "strategy" }: { onApply: (s: S) => void; placeholder: string; mode?: "strategy" | "scan" }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "warn" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const go = () => start(async () => {
    const r = await describeStrategy(text);
    if (r.error || !r.strategy) return setMsg({ tone: "err", text: r.error || "No rules found." });
    onApply(r.strategy);
    const n = r.strategy.entry.length + (mode === "strategy" ? r.strategy.exit.length : 0);
    const bits = [`Filled in ${n} condition${n === 1 ? "" : "s"}${r.source === "ai" ? " with AI" : ""}. Review them below, then run.`];
    if (r.strategy.notes) bits.push(r.strategy.notes);
    if (r.strategy.unparsed.length) bits.push(`Couldn't map: “${r.strategy.unparsed.join("”, “")}”.`);
    setMsg({ tone: r.strategy.unparsed.length ? "warn" : "ok", text: bits.join(" ") });
  });
  return (
    <div className="rounded-lg border border-brand/30 bg-brand/5 p-3">
      <label className="label" htmlFor="describe">Describe it in plain English</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea id="describe" rows={2} className="input flex-1" value={text} maxLength={1000} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go(); }} />
        <button type="button" className="btn btn-primary sm:self-start" disabled={pending || !text.trim()} onClick={go}>{pending ? "Building…" : "Build rules"}</button>
      </div>
      {msg && <p className={`mt-2 text-xs ${msg.tone === "err" ? "text-down" : msg.tone === "warn" ? "text-amber-300" : "text-up"}`}>{msg.text}</p>}
    </div>
  );
}
