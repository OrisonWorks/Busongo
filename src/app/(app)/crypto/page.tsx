import { notFound } from "next/navigation";
import { CRYPTO_ENABLED } from "@/config/features";
import { getQuotes } from "@/lib/market";
import QuoteTable from "@/components/QuoteTable";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
export const metadata = { title: "Crypto Markets" };
export const revalidate = 600;
export default async function Page() {
  if (!CRYPTO_ENABLED) notFound();
  const q = await getQuotes("CRYPTO");
  return (
    <div>
      <PageHeader title="Crypto Markets" subtitle="Daily prices in USDT for major cryptocurrencies (Binance public market data). Backtest and scan them like any LuSE stock." />
      <Link href="/crypto/kwacha" className="card mb-4 block p-4 text-sm hover:border-brand"><b className="text-brand">Kwacha & Stablecoins →</b> <span className="text-muted">Prices in ZMW, the USDT/ZMW P2P premium, and stablecoin yields vs GRZ T-bills.</span></Link>
      <Card><QuoteTable rows={q} base="/crypto" showSector={false} /></Card>
    </div>
  );
}
