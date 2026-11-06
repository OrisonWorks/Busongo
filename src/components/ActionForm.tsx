"use client";
import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/(auth)/actions";
export default function ActionForm({ action, children, submit, className = "grid gap-2 sm:grid-cols-4" }: { action: (s: FormState, fd: FormData) => Promise<FormState>; children: ReactNode; submit: string; className?: string }) {
  const [s, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className={className}>
      {children}
      <button disabled={pending} className="btn btn-primary">{pending ? "…" : submit}</button>
      {s?.error && <p className="col-span-full text-sm text-down">{s.error}</p>}
      {s?.ok && <p className="col-span-full text-sm text-up">{s.ok}</p>}
    </form>
  );
}
