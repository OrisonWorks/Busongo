import { INDICATORS } from "@/lib/engine/series";
import { LUSE_FEES, LUSE_FEE_RATE } from "@/config/fees";
export const metadata = { title: "Reference" };
const GLOSS: Record<string, string> = {
  sma: "Simple moving average: the mean close over N sessions.", ema: "Exponential moving average: weights recent closes more heavily.", rsi: "Relative Strength Index (0–100). Below 30 is oversold, above 70 overbought.",
  macd: "EMA(12) − EMA(26). Crosses of its 9-period signal line flag momentum shifts.", bbUpper: "Bollinger bands: SMA ± 2 standard deviations.", atr: "Average True Range: the typical daily move, in price terms.",
  adx: "Average Directional Index: trend strength. Above 25 is a strong trend.", supertrend: "ATR-based trailing line. Price above it means an uptrend.", roc: "Percentage change over N sessions.", highest: "Highest close over N sessions (252 ≈ 52 weeks).",
};
export default function Page() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-16">
      <h1 className="text-4xl font-bold">Reference</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">LuSE trading fees (per side)</h2>
          <table className="data mt-3"><tbody>
            <tr><td>SEC levy</td><td className="r">{(LUSE_FEES.sec * 100).toFixed(3)}%</td></tr>
            <tr><td>LuSE fee</td><td className="r">{(LUSE_FEES.luse * 100).toFixed(2)}%</td></tr>
            <tr><td>Broker commission (max)</td><td className="r">{(LUSE_FEES.broker * 100).toFixed(2)}%</td></tr>
            <tr><td className="font-semibold">Total</td><td className="r font-semibold">{(LUSE_FEE_RATE * 100).toFixed(3)}%</td></tr>
          </tbody></table>
          <p className="mt-2 text-xs text-muted">Source: luse.co.zm/trading/trading-fees-equity</p>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Market facts</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            <li>Settlement: through the LuSE Central Shares Depository (CSD).</li>
            <li>Data: end-of-day prices published each trading day.</li>
            <li>Benchmark: LuSE All Share Index (LASI).</li>
            <li>Boards: Main Board and Alternative Market (LuSE Alt-M).</li>
            <li>GRZ T-bills: 91, 182, 273 and 364 days, auctioned fortnightly by BoZ.</li>
            <li>GRZ bonds: 2 to 15 years, semi-annual coupons.</li>
          </ul>
        </section>
      </div>
      <h2 className="mt-10 text-2xl font-bold">Indicator glossary</h2>
      <div className="card mt-4 overflow-x-auto">
        <table className="data"><thead><tr><th>Indicator</th><th>Default period</th><th>What it means</th></tr></thead><tbody>
          {INDICATORS.filter((i) => GLOSS[i.id]).map((i) => (
            <tr key={i.id}><td className="font-medium">{i.label}</td><td>{"def" in i ? i.def : "—"}</td><td className="whitespace-normal text-muted">{GLOSS[i.id]}</td></tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}
