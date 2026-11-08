import { brand } from "@/config/brand";
import { PAYMENTS_ENABLED } from "@/config/features";
export const metadata = { title: "About us" };
export default function Page() {
  return (
    <div className="prose-dark mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">About {brand.name}</h1>
      <p>{brand.name} gives Zambian investors the research tools that investors in larger markets take for granted: no-code backtesting, technical scanners, fundamentals, fixed-income analytics and an AI analyst, all built around the Lusaka Securities Exchange and the Bank of Zambia.</p>
      <h2>Why we built it</h2>
      <p>LuSE data is scattered across daily web tables, PDF announcements and auction notices. We collect it every trading day, clean it and store it as history, so you can test an idea in seconds instead of rebuilding spreadsheets by hand.</p>
      <h2>Our principles</h2>
      <ul>
        <li><strong>Real costs.</strong> Every backtest includes LuSE, SEC and broker fees.</li>
        <li><strong>Local context.</strong> {PAYMENTS_ENABLED ? "Kwacha pricing, Zambian holidays, Mobile Money payments and T-bill benchmarks." : "Kwacha figures, Zambian holidays and T-bill benchmarks."}</li>
        <li><strong>Transparency.</strong> Every number links back to its LuSE or BoZ source.</li>
      </ul>
      <p>{brand.address} · {brand.email}</p>
    </div>
  );
}
