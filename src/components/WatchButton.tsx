"use client";
import { useState, useTransition } from "react";
import { toggleWatch } from "@/app/(app)/actions";

export default function WatchButton({ symbol, initial, signedIn }: { symbol: string; initial: boolean; signedIn: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  if (!signedIn) return <a href={`/login?next=/stocks/${symbol}`} className="btn btn-ghost">☆ Watch</a>;
  return <button disabled={pending} onClick={() => start(async () => setOn(await toggleWatch(symbol)))} className="btn btn-ghost">{on ? "★ Watching" : "☆ Watch"}</button>;
}
