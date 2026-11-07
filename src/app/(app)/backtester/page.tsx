import Link from "next/link";
import { getUser } from "@/lib/auth";
import { symbolOptions } from "@/lib/symbols";
import BasicBacktester from "@/components/backtest/BasicBacktester";
import DataNotice from "@/components/DataNotice";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Basic Backtester" };
export default async function Page({ searchParams }: { searchParams: Promise<{ symbol?: string }> }) {
  const [{ symbol }, user, symbols] = await Promise.all([searchParams, getUser(), symbolOptions()]);
  return (
    <div>
      <PageHeader title="Basic Backtester" subtitle="Test a proven strategy template on any LuSE stock or crypto in seconds — no code needed.">
        <Link href="/backtester/advanced" className="btn btn-ghost">Advanced backtester →</Link>
      </PageHeader>
      <DataNotice />
      <BasicBacktester symbols={symbols} initial={symbol?.toUpperCase()} signedIn={!!user} />
    </div>
  );
}
