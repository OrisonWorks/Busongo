"use client";
import { useState } from "react";
import { marked } from "marked";

type M = { role: string; content: string };
const SUGGEST = ["Which LuSE stocks rose most today?", "Explain the GRZ yield curve right now", "What's the real return on a 364-day T-bill?", "How do LuSE fees affect a short-term strategy?"];
export default function Chat({ initial, usage }: { initial: M[]; usage: { used: number; limit: number } }) {
  const [msgs, setMsgs] = useState<M[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [u, setU] = useState(usage);
  async function send(t = text) {
    if (!t.trim()) return;
    setBusy(true); setErr(""); setText("");
    setMsgs((m) => [...m, { role: "user", content: t }]);
    const r = await fetch("/api/aichat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: t }) });
    const j = await r.json();
    if (j.error) setErr(j.error); else { setMsgs((m) => [...m, { role: "assistant", content: j.reply }]); setU({ used: j.used, limit: j.limit }); }
    setBusy(false);
  }
  return (
    <div className="card flex h-[70vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!msgs.length && <div className="grid gap-2 sm:grid-cols-2">{SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-lg border border-line p-3 text-left text-sm hover:border-brand/50">{s}</button>)}</div>}
        {msgs.map((m, i) => m.role === "user"
          ? <div key={i} className="ml-auto max-w-[85%] rounded-xl bg-brand/20 px-4 py-2 text-sm">{m.content}</div>
          : <div key={i} className="prose-dark max-w-[85%] rounded-xl bg-panel2 px-4 py-2 text-sm" dangerouslySetInnerHTML={{ __html: marked.parse(m.content.replace(/&/g, "&amp;").replace(/</g, "&lt;"), { async: false }) as string }} />)}
        {busy && <div className="text-sm text-muted">Thinking…</div>}
        {err && <div className="text-sm text-down">{err}</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} className="input flex-1" placeholder="Ask about LuSE stocks, bonds, strategies…" />
        <button disabled={busy} className="btn btn-primary">Send</button>
      </form>
      <div className="px-3 pb-2 text-xs text-muted">{u.used}/{u.limit} messages used this month · AI answers can be wrong; not investment advice.</div>
    </div>
  );
}
