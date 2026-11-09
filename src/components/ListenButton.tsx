"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

const noop = () => () => {};
export default function ListenButton({ text, label, stopLabel, note }: { text: string; label: string; stopLabel: string; note?: string }) {
  const supported = useSyncExternalStore(noop, () => "speechSynthesis" in window, () => false);
  const [on, setOn] = useState(false);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  if (!supported) return null;
  const toggle = () => {
    const s = window.speechSynthesis;
    s.cancel();
    if (on) return setOn(false);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.9;
    u.onend = u.onerror = () => setOn(false);
    s.speak(u);
    setOn(true);
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={on} title={note} className="btn btn-ghost px-3 py-1.5 text-xs">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">{on ? <rect x="6" y="6" width="12" height="12" rx="1" /> : <path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />}</svg>
      {on ? stopLabel : label}
    </button>
  );
}
