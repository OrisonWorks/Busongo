import Link from "next/link";
import { getUser } from "@/lib/auth";
import { symbolOptions } from "@/lib/symbols";
import BasicBacktester, { type SavedBasic } from "@/components/backtest/BasicBacktester";
import { prisma } from "@/lib/db";
import DataNotice from "@/components/DataNotice";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Basic Backtester" };
export default async function Page({ searchParams }: { searchParams: Promise<{ symbol?: string; strategy?: string }> }) {
  const [{ symbol, strategy }, user, symbols] = await Promise.all([searchParams, getUser(), symbolOptions()]);
  const s = strategy && user ? await prisma.strategy.findFirst({ where: { id: strategy, userId: user.id, kind: "basic" } }) : null;
  return (
    <div>
      <PageHeader title="Basic Backtester" subtitle="Pick a strategy and see how it would have done on old LuSE prices — research only; past results never guarantee future ones.">
        <Link href="/backtester/advanced" className="btn btn-ghost">Advanced backtester →</Link>
      </PageHeader>
      <DataNotice />
      <BasicBacktester key={s?.id} symbols={symbols} initial={symbol?.toUpperCase()} signedIn={!!user} saved={(s?.config as SavedBasic) ?? undefined} />
    </div>
  );
}
