"use client";
import { INDICATORS, OPS, type Cond, type Operand } from "@/lib/engine/series";

function OperandPicker({ v, onChange }: { v: Operand; onChange: (o: Operand) => void }) {
  const meta = INDICATORS.find((i) => i.id === v.ind)!;
  return (
    <div className="flex gap-1">
      <select className="input w-auto" value={v.ind} onChange={(e) => { const m = INDICATORS.find((i) => i.id === e.target.value)!; onChange({ ind: m.id, period: "def" in m ? m.def : undefined, value: m.id === "number" ? 0 : undefined }); }}>
        {INDICATORS.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
      </select>
      {meta.period && <input type="number" className="input w-16" value={v.period ?? ("def" in meta ? meta.def : 14)} onChange={(e) => onChange({ ...v, period: +e.target.value })} title="Period" />}
      {v.ind === "number" && <input type="number" step="any" className="input w-20" value={v.value ?? 0} onChange={(e) => onChange({ ...v, value: +e.target.value })} />}
    </div>
  );
}

export default function CondBuilder({ conds, onChange, join, onJoin }: { conds: Cond[]; onChange: (c: Cond[]) => void; join: "AND" | "OR"; onJoin: (j: "AND" | "OR") => void }) {
  const set = (i: number, c: Cond) => onChange(conds.map((x, k) => (k === i ? c : x)));
  return (
    <div className="space-y-2">
      {conds.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1 rounded-lg bg-panel2 p-2">
          {i > 0 && <button type="button" className="rounded bg-brand/20 px-2 py-1 text-xs font-semibold text-brand" onClick={() => onJoin(join === "AND" ? "OR" : "AND")}>{join}</button>}
          <OperandPicker v={c.left} onChange={(o) => set(i, { ...c, left: o })} />
          <select className="input w-auto" value={c.op} onChange={(e) => set(i, { ...c, op: e.target.value as Cond["op"] })}>{OPS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
          <OperandPicker v={c.right} onChange={(o) => set(i, { ...c, right: o })} />
          <button type="button" className="ml-auto px-2 text-muted hover:text-down" onClick={() => onChange(conds.filter((_, k) => k !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost text-xs" onClick={() => onChange([...conds, { left: { ind: "close" }, op: "gt", right: { ind: "sma", period: 50 } }])}>+ Add condition</button>
    </div>
  );
}
