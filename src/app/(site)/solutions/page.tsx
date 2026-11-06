import Link from "next/link";
export const metadata = { title: "Solutions" };
const S = [
  { id: "investors", t: "Long-term investors", d: "Find undervalued, dividend-paying LuSE companies. Compare P/E, P/B, dividend yield and ROE, read every SENS, and check whether a stock beats the risk-free T-bill rate.", links: [["/fundamentals", "Fundamentals screener"], ["/sens", "SENS announcements"], ["/calendar", "Dividend calendar"]] },
  { id: "traders", t: "Active traders", d: "Turn ideas into rules, then backtest them with LuSE's real 1.375% fee per side. Scan for signals each evening and set alerts for your levels.", links: [["/backtester/advanced", "Advanced backtester"], ["/scanner", "Scanner"], ["/alerts", "Alerts"]] },
  { id: "fixed-income", t: "Fixed-income investors", d: "Track every Bank of Zambia T-bill and GRZ bond auction, follow the yield curve and real yields, and work out after-tax returns before you bid.", links: [["/fixed-income/yield-curve", "Yield curve"], ["/fixed-income/calculator", "Calculators"], ["/macro", "Macro dashboard"]] },
  { id: "institutions", t: "Pension funds & asset managers", d: "Portfolio-level backtests, correlation matrices, relative strength against LASI and CSV exports for your own models.", links: [["/tools/correlation", "Correlation"], ["/tools/relative-strength", "Relative strength"], ["/pricing", "Pro plan"]] },
  { id: "students", t: "Students & educators", d: "Learn technical and fundamental analysis using real Zambian data, with an AI tutor that explains every metric.", links: [["/reference", "Reference"], ["/blog", "Guides"], ["/aichat", "AI assistant"]] },
];
export default function Page() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16">
      <h1 className="text-4xl font-bold">Solutions</h1>
      <p className="mt-2 text-muted">Whatever kind of investor you are, the same reliable Zambian market data powers your workflow.</p>
      <div className="mt-10 space-y-6">
        {S.map((s) => (
          <section key={s.id} id={s.id} className="card scroll-mt-20 p-6">
            <h2 className="text-xl font-semibold">{s.t}</h2>
            <p className="mt-2 text-muted">{s.d}</p>
            <div className="mt-4 flex flex-wrap gap-2">{s.links.map(([h, l]) => <Link key={h} href={h} className="btn btn-ghost">{l}</Link>)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
