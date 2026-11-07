import { getQuotes } from "@/lib/market";
import QuoteTable from "@/components/QuoteTable";
import { Card, PageHeader } from "@/components/ui";
export const metadata = { title: "Crypto Markets" };
export const revalidate = 600;
export default async function Page() {
  const q = await getQuotes("CRYPTO");
  return (
    <div>
      <PageHeader title="Crypto Markets" subtitle="Daily prices in USDT for major cryptocurrencies (Binance public market data). Backtest and scan them like any LuSE stock." />
      <Card><QuoteTable rows={q} base="/crypto" showSector={false} /></Card>
    </div>
  );
}
