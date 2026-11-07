import Link from "next/link";
import { PLANS, PLAN_ORDER } from "@/config/plans";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Pricing" };

const FEATURES: [string, (p: (typeof PLANS)[keyof typeof PLANS]) => string | boolean][] = [
  ["Price history", (p) => p.historyLabel],
  ["Scanner results", (p) => `${p.scanResults}`],
  ["Price alerts", (p) => `${p.alerts}`],
  ["AI assistant messages / month", (p) => `${p.aiMessages}`],
  ["Advanced backtests / month", (p) => `${p.advancedBacktests}`],
  ["Basic backtester", () => true],
  ["Market terminal, LASI & breadth", () => true],
  ["T-bill & bond auctions, yield curve", () => true],
  ["Fundamentals screener", (p) => p.id !== "FREE"],
  ["Multi-stock portfolio backtests", (p) => p.id !== "FREE"],
  ["Gann & Smart Money tools", (p) => p.id !== "FREE"],
  ["CSV exports", (p) => p.id === "PRO"],
  ["Priority WhatsApp support", (p) => p.id === "PRO"],
];

export default async function Pricing() {
  const user = await getUser();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16">
      <h1 className="text-center text-4xl font-bold">Plans for every investor</h1>
      <p className="mt-2 text-center text-muted">Prices in Zambian Kwacha. Pay monthly with Airtel Money or MTN MoMo. Save 20% when you pay for 12 months.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          return (
            <div key={id} className={`card relative flex flex-col p-6 ${p.popular ? "border-brand ring-1 ring-brand" : ""}`}>
              {p.popular && <div className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-black">Most popular</div>}
              <div className="text-lg font-semibold">{p.label}</div>
              <div className="mt-3"><span className="text-4xl font-bold">K{p.priceZmw}</span><span className="text-muted">/month</span></div>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {FEATURES.map(([label, f]) => {
                  const v = f(p);
                  return (
                    <li key={label} className={`flex justify-between gap-2 ${v === false ? "text-muted/50" : ""}`}>
                      <span>{label}</span>
                      <span className="font-medium">{v === true ? "✓" : v === false ? "—" : v}</span>
                    </li>
                  );
                })}
              </ul>
              <Link href={id === "FREE" ? (user ? "/dashboard" : "/register") : user ? `/payment?plan=${id}` : `/register?next=${encodeURIComponent(`/payment?plan=${id}`)}`} className={`btn mt-6 ${p.popular ? "btn-primary" : "btn-ghost"}`}>
                {id === "FREE" ? "Start free" : `Get ${p.label}`}
              </Link>
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-16 max-w-3xl space-y-4">
        <h2 className="text-2xl font-bold">FAQ</h2>
        {[
          ["How do I pay?", "Choose a plan, enter your Airtel Money or MTN MoMo number and approve the prompt on your phone. Your plan is activated as soon as the payment is confirmed."],
          ["Can I cancel?", "Plans are prepaid and do not renew automatically. You keep access until the end of the period you paid for."],
          ["Where does the data come from?", "Equity prices and announcements come from the Lusaka Securities Exchange's public pages. Auction results and macro rates come from the Bank of Zambia. Crypto prices come from Binance public market data."],
          ["Is this investment advice?", "No. The platform is for research and education. Always do your own due diligence and speak to a licensed LuSE broker before investing."],
        ].map(([q, a]) => (
          <details key={q} className="card p-4"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-muted">{a}</p></details>
        ))}
      </div>
    </div>
  );
}
