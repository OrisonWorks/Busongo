"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Wallet redirect target: MyNearWallet returns accountId, publicKey and signature in the URL hash (or query). */
export default function Page() {
  const [state, setState] = useState<{ error?: string; ok?: string }>({});
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
    if (p.get("errorCode") || !p.get("signature")) { setState({ error: p.get("errorCode") === "userRejected" ? "You cancelled the wallet request." : "The wallet did not return a signature." }); return; }
    fetch("/api/auth/near/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: p.get("accountId"), publicKey: p.get("publicKey"), signature: p.get("signature") }) })
      .then((r) => r.json())
      .then((j) => { if (j.error) setState({ error: j.error }); else { setState({ ok: j.accountId }); window.location.replace(j.next); } })
      .catch(() => setState({ error: "Could not verify the signature." }));
  }, []);
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4">
      <div className="card w-full p-8 text-center">
        {state.error ? <><h1 className="text-xl font-bold">Wallet sign-in failed</h1><p className="mt-2 text-sm text-muted">{state.error}</p><Link href="/login" className="btn btn-primary mt-4">Back to sign in</Link></>
          : <><h1 className="text-xl font-bold">{state.ok ? `Signed in as ${state.ok}` : "Verifying your wallet…"}</h1><p className="mt-2 text-sm text-muted">Checking the NEAR signature and account key.</p></>}
      </div>
    </div>
  );
}
