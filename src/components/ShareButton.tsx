"use client";
import { useState } from "react";

/** Shares a card as a picture through the phone's share sheet (WhatsApp included) and falls back to a WhatsApp text message. */
export default function ShareButton({ text, image, file, label }: { text: string; image: string; file: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const share = async (e: React.MouseEvent) => {
    if (!navigator.canShare) return;
    e.preventDefault();
    setBusy(true);
    try {
      const blob = await (await fetch(image)).blob();
      const files = [new File([blob], file, { type: blob.type || "image/png" })];
      if (navigator.canShare({ files })) await navigator.share({ files, text });
      // Same-tab navigation needs no click activation, so it can't be popup-blocked after a slow image fetch.
      else window.location.href = wa;
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") window.location.href = wa;
    } finally {
      setBusy(false);
    }
  };
  return (
    <a href={wa} target="_blank" rel="noopener noreferrer" onClick={share} aria-busy={busy} className="btn btn-ghost px-3 py-1.5 text-xs">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z" /></svg>
      {label}
    </a>
  );
}
