import { Tabs } from "./ui";
export default function MarketTabs({ active }: { active: string }) {
  return <Tabs active={active} items={[{ href: "/market", label: "Overview" }, { href: "/market/heatmap", label: "Heatmap" }, { href: "/market/movers", label: "Movers & Turnover" }, { href: "/market/sectors", label: "Sectors & Breadth" }, { href: "/stocks", label: "All Stocks" }]} />;
}
