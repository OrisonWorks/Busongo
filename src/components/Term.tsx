"use client";
import { useEffect, useId, useRef, useState } from "react";

/** A jargon word that shows a plain explanation when tapped. */
export default function Term({ children, title, def }: { children: React.ReactNode; title: string; def: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-block">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="cursor-help underline decoration-dotted underline-offset-4 hover:text-brand">
        {children}
      </button>
      {open && (
        <span id={id} role="note" className={`absolute top-full z-30 mt-1 block w-64 max-w-[85vw] rounded-lg border border-line bg-panel2 p-3 text-left text-xs font-normal normal-case leading-relaxed text-fg shadow-xl ${ref.current && ref.current.getBoundingClientRect().left + 256 > window.innerWidth ? "right-0" : "left-0"}`}>
          <b className="mb-1 block">{title}</b>{def}
        </span>
      )}
    </span>
  );
}
