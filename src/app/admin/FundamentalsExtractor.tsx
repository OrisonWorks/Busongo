"use client";
import { useActionState } from "react";
import ActionForm from "@/components/ActionForm";
import { extractFundamentalsAction, importFundamentalsAction, type ExtractState } from "./actions";

export default function FundamentalsExtractor({ symbols, configured }: { symbols: string[]; configured: boolean }) {
  const [st, act, pending] = useActionState<ExtractState, FormData>(extractFundamentalsAction, undefined);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Upload an annual or interim report PDF (or paste a SENS PDF link). The AI reads it and drafts a fundamentals row. Check the figures, edit if needed, then import.{!configured && " Requires AI_API_KEY."}</p>
      <form action={act} className="grid gap-2 sm:grid-cols-4">
        <select name="symbol" className="input" required defaultValue=""><option value="" disabled>Company…</option>{symbols.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="file" name="pdf" accept="application/pdf,.pdf" className="input" />
        <input name="url" type="url" className="input" placeholder="…or https://www.luse.co.zm/…pdf" />
        <button className="btn btn-primary" disabled={pending || !configured}>{pending ? "Reading report…" : "Extract figures"}</button>
      </form>
      {st?.error && <p className="text-sm text-down">{st.error}</p>}
      {st?.csv && (
        <ActionForm action={importFundamentalsAction} submit="Import these figures" className="space-y-2">
          {st.notes && <p className="text-xs text-muted">{st.notes}</p>}
          <textarea key={st.csv} name="csv" rows={3} defaultValue={st.csv} className="input font-mono text-xs" />
        </ActionForm>
      )}
    </div>
  );
}
