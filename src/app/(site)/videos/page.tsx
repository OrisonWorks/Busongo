import Link from "next/link";
export const metadata = { title: "Videos" };
const V = [
  { t: "Getting started: your first LuSE backtest", d: "Build a moving-average strategy on ZNCO and read the results.", h: "/backtester", len: "6 min" },
  { t: "Advanced backtester: combining conditions", d: "RSI + trend filters, stop-losses and portfolio tests.", h: "/backtester/advanced", len: "11 min" },
  { t: "Reading the GRZ yield curve", d: "T-bills to 15-year bonds, real yields and after-tax returns.", h: "/fixed-income/yield-curve", len: "8 min" },
  { t: "Scanning LuSE every evening", d: "Preset and custom scans, saving them and turning them into alerts.", h: "/scanner", len: "7 min" },
  { t: "Fundamentals: valuing a LuSE company", d: "P/E, P/B, dividend yield and the T-bill hurdle rate.", h: "/fundamentals", len: "9 min" },
  { t: "Smart Money Concepts on illiquid stocks", d: "Market structure, order blocks and fair-value gaps.", h: "/tools/smc", len: "10 min" },
];
export default function Page() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16">
      <h1 className="text-4xl font-bold">Videos</h1>
      <p className="mt-2 text-muted">Step-by-step tutorials. Each one links to the tool it covers.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {V.map((v) => (
          <Link key={v.t} href={v.h} className="card overflow-hidden hover:border-brand/40">
            <div className="grid aspect-video place-items-center bg-gradient-to-br from-emerald-900/40 to-amber-900/30 text-4xl">▶</div>
            <div className="p-4">
              <div className="font-semibold">{v.t}</div>
              <p className="mt-1 text-sm text-muted">{v.d}</p>
              <div className="mt-2 text-xs text-muted">{v.len} · Open the tool →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
