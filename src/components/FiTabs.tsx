import { Tabs } from "./ui";
export default function FiTabs({ active }: { active: string }) {
  return <Tabs active={active} items={[{ href: "/fixed-income", label: "Overview" }, { href: "/fixed-income/yield-curve", label: "Yield Curve" }, { href: "/fixed-income/tbills", label: "T-Bill Auctions" }, { href: "/fixed-income/bonds", label: "Bond Auctions" }, { href: "/fixed-income/corporate", label: "Listed Bonds" }, { href: "/fixed-income/calculator", label: "Calculators" }, { href: "/macro", label: "Macro" }]} />;
}
