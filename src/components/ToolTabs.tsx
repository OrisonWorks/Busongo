import { Tabs } from "./ui";
export default function ToolTabs({ active }: { active: string }) {
  return <Tabs active={active} items={[["gann", "Gann"], ["smc", "Smart Money"], ["pivots", "Pivots"], ["relative-strength", "Relative Strength"], ["correlation", "Correlation"], ["seasonality", "Seasonality"]].map(([h, l]) => ({ href: `/tools/${h}`, label: l }))} />;
}
