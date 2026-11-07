import Link from "next/link";
import type { Plan } from "@prisma/client";
import { PLANS } from "@/config/plans";

export default function PlanLock({ min, feature, signedIn }: { min: Plan; feature: string; signedIn: boolean }) {
  return (
    <div className="card mt-4 grid place-items-center gap-3 p-10 text-center">
      <div className="text-lg font-semibold">{feature} are part of the {PLANS[min].label} plan</div>
      <p className="max-w-md text-sm text-muted">Upgrade to {PLANS[min].label} (K{PLANS[min].priceZmw}/month) or Pro to unlock {feature.toLowerCase()}.</p>
      <div className="flex gap-2">
        <Link href="/pricing" className="btn btn-primary">See plans</Link>
        {!signedIn && <Link href="/login" className="btn btn-ghost">Sign in</Link>}
      </div>
    </div>
  );
}
