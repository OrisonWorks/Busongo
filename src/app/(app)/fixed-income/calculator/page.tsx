import { yieldCurve } from "@/lib/fixed-income";
import { latestMacro } from "@/lib/market";
import FiTabs from "@/components/FiTabs";
import FiCalculators from "@/components/FiCalculators";
import { PageHeader } from "@/components/ui";
import { WHT_DEFAULT } from "@/lib/fi";

export const metadata = { title: "Fixed-Income Calculators" };
export default async function Page() {
  const [c, m] = await Promise.all([yieldCurve(), latestMacro()]);
  const tb = c.find((x) => x.tenor === "364d"), b = c.filter((x) => x.kind === "Bond").at(-1);
  return (
    <div>
      <PageHeader title="Fixed-Income Calculators" subtitle="Pre-filled with the latest auction yields. Change any input." />
      <FiTabs active="/fixed-income/calculator" />
      <FiCalculators defaults={{ tbYield: tb?.yield ?? 10, tbDays: 364, bondCoupon: b?.coupon ?? 15, bondYield: b?.yield ?? 15, bondYears: b?.years ?? 10, inflation: m.INFLATION?.value ?? 6, wht: WHT_DEFAULT }} />
    </div>
  );
}
