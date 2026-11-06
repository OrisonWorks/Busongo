"use client";
import { useActionState } from "react";
import type { FormState } from "@/app/(auth)/actions";

export type Field = { name: string; label: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string };

export default function AuthForm({ action, fields, submit, hidden = {} }: { action: (s: FormState, fd: FormData) => Promise<FormState>; fields: Field[]; submit: string; hidden?: Record<string, string> }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-4">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <div key={f.name}>
          <label className="label" htmlFor={f.name}>{f.label}</label>
          <input id={f.name} name={f.name} type={f.type || "text"} placeholder={f.placeholder} required={f.required ?? true} defaultValue={f.defaultValue} className="input" />
        </div>
      ))}
      {state?.error && <p className="text-sm text-down">{state.error}</p>}
      {state?.ok && <p className="text-sm text-up">{state.ok}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "Please wait…" : submit}</button>
    </form>
  );
}
