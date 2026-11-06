"use client";
import { useActionState } from "react";
import { createAlert } from "@/app/(app)/actions";

export default function AlertForm({ symbols, defaultSymbol }: { symbols: string[]; defaultSymbol?: string }) {
  const [s, run, pending] = useActionState(createAlert, undefined);
  return (
    <form action={run} className="grid gap-2 sm:grid-cols-5">
      <select name="symbol" defaultValue={defaultSymbol} className="input">{symbols.map((x) => <option key={x}>{x}</option>)}</select>
      <select name="metric" className="input"><option value="close">Close price</option><option value="changePct">Daily % change</option><option value="volume">Volume</option><option value="value">Value traded</option></select>
      <select name="operator" className="input"><option value="gt">rises above</option><option value="lt">falls below</option></select>
      <input name="threshold" type="number" step="any" required placeholder="Level" className="input" />
      <button disabled={pending} className="btn btn-primary">Create alert</button>
      {s?.error && <p className="text-sm text-down sm:col-span-5">{s.error}</p>}
      {s?.ok && <p className="text-sm text-up sm:col-span-5">{s.ok}</p>}
    </form>
  );
}
