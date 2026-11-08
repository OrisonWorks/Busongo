"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES } from "@/lib/i18n";
import { setLang } from "./LanguageSwitcher";

type Prefs = { text?: "lg" | "xl"; contrast?: boolean; motion?: boolean };
const KEY = "busongo-a11y";
const read = (): Prefs => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
function apply(p: Prefs) {
  const d = document.documentElement;
  if (p.text) d.dataset.text = p.text; else delete d.dataset.text;
  if (p.contrast) d.dataset.contrast = "high"; else delete d.dataset.contrast;
  if (p.motion) d.dataset.motion = "reduce"; else delete d.dataset.motion;
}
/** Runs before paint (inlined in the root layout) so saved settings don't flash. */
export const A11Y_BOOT = `try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}"),d=document.documentElement;if(p.text)d.dataset.text=p.text;if(p.contrast)d.dataset.contrast="high";if(p.motion)d.dataset.motion="reduce"}catch(e){}`;

export default function A11yMenu({ lang }: { lang: string }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Prefs>({});
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!open) return;
    setP(read());
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open]);
  const update = (n: Prefs) => { setP(n); localStorage.setItem(KEY, JSON.stringify(n)); apply(n); };
  const sizes = [["", "A"], ["lg", "A+"], ["xl", "A++"]] as const;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="a11y-panel" aria-label="Accessibility and language" className="btn btn-ghost px-2.5 py-1.5" title="Accessibility and language">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><circle cx="12" cy="4" r="2" /><path d="M21 9h-6v13h-2v-6h-2v6H9V9H3V7h18v2z" /></svg>
      </button>
      {open && (
        <div id="a11y-panel" role="dialog" aria-label="Accessibility and language" className="card fixed inset-x-4 top-16 z-50 space-y-4 p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72">
          <fieldset>
            <legend className="label text-sm">Text size</legend>
            <div className="flex gap-2">
              {sizes.map(([v, l]) => (
                <button key={v} type="button" aria-pressed={(p.text ?? "") === v} onClick={() => update({ ...p, text: (v || undefined) as Prefs["text"] })} className={`btn flex-1 ${(p.text ?? "") === v ? "btn-primary" : "btn-ghost"}`}>{l}</button>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center justify-between gap-3 text-sm">High contrast<input type="checkbox" className="h-5 w-5" checked={!!p.contrast} onChange={(e) => update({ ...p, contrast: e.target.checked })} /></label>
          <label className="flex items-center justify-between gap-3 text-sm">Reduce motion<input type="checkbox" className="h-5 w-5" checked={!!p.motion} onChange={(e) => update({ ...p, motion: e.target.checked })} /></label>
          <label className="block text-sm">Language
            <select className="input mt-1 text-base" value={lang} onChange={(e) => { setLang(e.target.value); router.refresh(); }}>
              {LOCALES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
            </select>
          </label>
          <p className="text-xs text-muted">Local languages cover Kwacha Today first.</p>
        </div>
      )}
    </div>
  );
}
