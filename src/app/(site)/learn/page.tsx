import Link from "next/link";
import Glossed from "@/components/Glossed";
import { brand } from "@/config/brand";

export const metadata = { title: "How shares work", description: "A beginner’s guide to shares, dividends, the LASI and T-bills, in plain language for Zambians." };

const S = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="card p-6">
    <h2 className="mb-3 text-xl font-bold">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-muted [&_b]:text-fg">{children}</div>
  </section>
);

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <div>
        <h1 className="text-4xl font-bold">How shares work</h1>
        <p className="mt-2 text-muted">A beginner’s guide to the stock market, in plain language. Dotted words can be tapped for a one-line explanation.</p>
      </div>

      <S id="share" title="1. What is a share?">
        <p>A <b>share</b> is a small piece of a company. When Zanaco or Shoprite sells shares on the <Glossed k="stock-exchange">stock exchange</Glossed>, anyone can buy a small piece of that business — you literally become a part-owner.</p>
        <p>If the company does well, your piece becomes more valuable and the company may share its profit with you. If it does badly, your piece loses value. You never lose more than you paid in.</p>
      </S>

      <S id="prices" title="2. Why do prices move?">
        <p>A share’s price is just the last price a buyer and seller agreed on. The <Glossed k="bidask">bid and ask</Glossed> are the best prices buyers offer and sellers accept right now. When more people want to buy than sell, the price climbs; when more want to sell, it falls.</p>
        <p><Glossed k="volume">Volume</Glossed> tells you how many shares changed hands — a big price move on high volume means more people agree with it.</p>
      </S>

      <S id="dividends" title="3. Dividends: getting paid to own">
        <p>Many LuSE companies share part of their profit with owners as a <b>dividend</b> — cash paid for each share you hold, usually once or twice a year. The <Glossed k="divyield">dividend yield</Glossed> tells you how much cash a share pays compared to its price.</p>
        <p>That’s what makes shares different from a bet: a profitable company pays you to wait.</p>
      </S>

      <S id="lasi" title="4. The LASI: the market’s scoreboard">
        <p>The <Glossed k="lasi">LASI</Glossed> is one number that tracks all LuSE shares together. When you hear “the market is up,” it usually means the LASI went up. It’s the quickest way to see how Zambian companies are doing overall.</p>
      </S>

      <S id="vs" title="5. Shares vs T-bills and bonds">
        <p>Buying a share makes you an <b>owner</b>. Buying a <Glossed k="tbill">T-bill</Glossed> or <Glossed k="bond">bond</Glossed> makes you a <b>lender</b> — you lend money to the government and get a fixed return.</p>
        <p>The government sells them by <Glossed k="auction">auction</Glossed>, and the <Glossed k="yield">yield</Glossed> is your yearly return. The <Glossed k="yieldcurve">yield curve</Glossed> shows the return for every loan length at once.</p>
        <p>Simple version: T-bills and bonds are steadier and predictable; shares can grow much more but can also fall.</p>
      </S>

      <S id="quote" title="6. Reading a price quote">
        <p>Every stock page shows the price, the day’s change, the <Glossed k="bidask">bid and ask</Glossed>, and the day’s <Glossed k="volume">volume</Glossed> and trading value. The <Glossed k="marketcap">market cap</Glossed> tells you the total size of the company.</p>
        <p>Company health is judged with ratios: the <Glossed k="pe">P/E</Glossed> (price vs yearly profit), <Glossed k="pb">P/B</Glossed> (price vs what the company owns) and <Glossed k="roe">ROE</Glossed> (profit per kwacha of owners’ money).</p>
      </S>

      <S id="risk" title="7. What risk actually means">
        <p>Risk is how much the price can move against you. <Glossed k="volatility">Volatility</Glossed> measures the size of the swings; the <Glossed k="drawdown">worst fall</Glossed> shows the biggest past drop; <Glossed k="beta">beta</Glossed> compares a share’s swings to the whole market.</p>
        <p>A share that swings twice as much as the LASI can make you twice as happy — or twice as sad.</p>
      </S>

      <S id="sens" title="8. SENS: companies must tell you">
        <p>Listed companies can’t keep secrets from shareholders. Results, dividends, leadership changes and warnings are all published on <Glossed k="sens">SENS</Glossed> — it’s the first place to check what a company just announced.</p>
      </S>

      <S id="busongo" title={`9. What ${brand.name} is (and isn't)`}>
        <p>{brand.name} is a <b>research and education</b> platform: we collect LuSE and Bank of Zambia data and explain it in plain language — <Link href="/kwacha-today" className="text-brand">Kwacha Today</Link>, <Link href="/stocks" className="text-brand">stock pages</Link>, <Link href="/tools/compare" className="text-brand">comparison tools</Link> and <Link href="/backtester" className="text-brand">backtests</Link> on old prices.</p>
        <p><b>What we never do:</b> no buying or selling, no payments, and no investment advice. We will never tell you which share to buy — only help you understand the figures. To actually buy shares you need a licensed stockbroker.</p>
      </S>

      <div className="card border-brand/30 p-6 text-center">
        <p className="text-sm text-muted">Ready to look at real figures? Start with today’s numbers in plain words.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <Link href="/kwacha-today" className="btn">Kwacha Today →</Link>
          <Link href="/stocks" className="btn btn-ghost">Browse LuSE shares</Link>
        </div>
      </div>
    </div>
  );
}
