import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import Scanner, { type SavedScanConfig } from "@/components/scan/Scanner";
import DataNotice from "@/components/DataNotice";
import { Card, PageHeader } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Scanner" };
export default async function Page({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await getUser();
  const [sectors, scans, watch] = await Promise.all([
    prisma.security.findMany({ where: { assetClass: "EQUITY", sector: { not: null } }, distinct: ["sector"], select: { sector: true } }),
    user ? prisma.savedScan.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }) : [],
    user ? prisma.watchItem.findMany({ where: { userId: user.id } }) : [],
  ]);
  const init = scans.find((s) => s.id === saved)?.config as SavedScanConfig | undefined;
  return (
    <div>
      <PageHeader title="Scanner" subtitle="Scan every LuSE stock or crypto for technical setups on the latest session. Combine conditions with AND/OR." />
      <DataNotice />
      <Scanner key={saved} sectors={sectors.map((s) => s.sector!).sort()} signedIn={!!user} watchSymbols={watch.map((w) => w.symbol)} initial={init} />
      {scans.length > 0 && <Card title="My saved scans" className="mt-4">{scans.map((s) => <Link key={s.id} href={`/scanner?saved=${s.id}`} className="mr-2 inline-block rounded bg-panel2 px-3 py-1 text-sm hover:text-brand">{s.name}</Link>)}</Card>}
    </div>
  );
}
