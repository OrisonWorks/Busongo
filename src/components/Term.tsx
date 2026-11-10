"use client";
import { useEffect, useId, useRef, useState } from "react";

/** A jargon word that shows a plain explanation when tapped. */
export default function Term({ children, title, def }: { children: React.ReactNode; title: string; def: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.left, window.innerWidth - 264));
      // Open upward when more room sits above the word: the popover is fixed, so a
      // below-the-fold placement can't be scrolled into view.
      const above = window.innerHeight - r.bottom < 120 && r.top > window.innerHeight - r.bottom;
      setPos(above ? { left, bottom: window.innerHeight - r.top + 4 } : { left, top: r.bottom + 4 });
    }
    setOpen(!open);
  };
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
      <button type="button" aria-expanded={open} aria-controls={id} onClick={toggle} className="cursor-help underline decoration-dotted underline-offset-4 hover:text-brand">
        {children}
      </button>
      {open && (
        <span id={id} role="note" style={pos} className="fixed z-30 block max-h-[60vh] w-64 max-w-[85vw] overflow-auto rounded-lg border border-line bg-panel2 p-3 text-left text-xs font-normal normal-case leading-relaxed text-fg shadow-xl">
          <b className="mb-1 block">{title}</b>{def}
        </span>
      )}
    </span>
  );
}
