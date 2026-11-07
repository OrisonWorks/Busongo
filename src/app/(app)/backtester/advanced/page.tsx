import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { symbolOptions } from "@/lib/symbols";
import AdvancedBacktester from "@/components/backtest/AdvancedBacktester";
import DataNotice from "@/components/DataNotice";
import { Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "Advanced Backtester" };
export default async function Page({ searchParams }: { searchParams: Promise<{ strategy?: string }> }) {
  const [{ strategy }, user, symbols] = await Promise.all([searchParams, getUser(), symbolOptions()]);
  const s = strategy && user ? await prisma.strategy.findFirst({ where: { id: strategy, userId: user.id } }) : null;
  return (
    <div>
      <PageHeader title="Advanced Backtester" subtitle="Combine any indicators with AND/OR logic, add stops and position sizing, and test a whole portfolio of LuSE stocks or cryptos." />
      {!user && <Notice tone="blue"><Link href="/login?next=/backtester/advanced" className="underline">Sign in</Link> to run advanced backtests. Free accounts get 5 a month.</Notice>}
      <DataNotice />
      <AdvancedBacktester symbols={symbols} signedIn={!!user} initial={(s?.config as Record<string, unknown>) ?? undefined} />
    </div>
  );
}
