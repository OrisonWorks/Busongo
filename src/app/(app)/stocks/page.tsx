import { getQuotes } from "@/lib/market";
import MarketTabs from "@/components/MarketTabs";
import QuoteTable from "@/components/QuoteTable";
import { Card, PageHeader } from "@/components/ui";
export const metadata = { title: "All LuSE Stocks" };
export const revalidate = 300;
export default async function Page() {
  const q = await getQuotes();
  return (
    <div>
      <PageHeader title="All LuSE Stocks" subtitle={`${q.length} listed securities on the Main Board and Alternative Market`} />
      <MarketTabs active="/stocks" />
      <Card><QuoteTable rows={q} /></Card>
    </div>
  );
}
