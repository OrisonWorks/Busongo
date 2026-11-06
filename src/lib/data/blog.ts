export const BLOG_POSTS = [
  {
    slug: "how-luse-trading-fees-affect-your-backtest",
    title: "How LuSE trading fees change your backtest results",
    excerpt: "Every LuSE trade costs about 1.375% per side. Here is why that matters more than your entry signal.",
    category: "Backtesting",
    content: `## The fee stack

Each equity trade on the Lusaka Securities Exchange carries regulated charges on **both the buy and the sell side**:

| Charge | Fee |
|---|---|
| Securities and Exchange Commission (SEC) | 0.125% |
| LuSE | 0.25% |
| Broker | 1% |
| **Total per side** | **1.375%** |

A full round trip therefore costs roughly **2.75%** before any price movement.

## Why it matters

A strategy that trades weekly and wins 0.5% per trade on paper loses money once fees are included. Our backtester models the full fee stack by default, so you can see the real edge after costs.

## Practical tips

- Prefer lower-turnover strategies (trend following, monthly rebalancing).
- Compare every result with simply holding a 364-day T-bill: if the strategy does not beat the risk-free yield after fees, it is not worth the risk.
- Use the *minimum hold* setting in the advanced backtester to avoid churn.`,
  },
  {
    slug: "reading-the-grz-yield-curve",
    title: "Reading the GRZ yield curve: T-bills to 15-year bonds",
    excerpt: "What the shape of Zambia's government yield curve tells you about rates, inflation and equities.",
    category: "Fixed Income",
    content: `## What is the yield curve?

The yield curve plots the yield of Government of the Republic of Zambia (GRZ) securities against their tenor: 91-, 182-, 273- and 364-day Treasury bills, and 2- to 15-year bonds sold at Bank of Zambia auctions.

## Shapes to watch

- **Upward sloping** – investors demand more to lock money away for longer. This is the normal shape.
- **Flat** – short and long rates are similar; often seen when the market expects the policy rate to fall.
- **Inverted** – short rates above long rates; usually a sign of tight monetary policy.

## Real yields

Subtract annual inflation from a nominal yield to estimate the *real* return. The Fixed Income section shows real yields using the latest Bank of Zambia inflation print.

## Why equity investors care

T-bill yields are the hurdle rate for every LuSE stock. When the 364-day bill yields 15%, a stock needs a much higher expected return to justify the risk and the fees.`,
  },
  {
    slug: "rsi-on-illiquid-stocks",
    title: "Using RSI and moving averages on thinly traded LuSE stocks",
    excerpt: "Many LuSE counters do not trade every day. Here is how to adjust technical indicators for that.",
    category: "Technical Analysis",
    content: `## The liquidity problem

On many LuSE counters the closing price does not change for days because no trades happen. Indicators like RSI then flatten out and give fewer signals.

## Adjustments that help

1. **Filter by turnover** – use the scanner's *value traded* filter to focus on counters with real activity.
2. **Use longer look-backs** – a 50/200-day moving-average cross is more robust than a 5/20 cross on illiquid names.
3. **Check the order book** – LuSE publishes best bid and ask. A wide spread means your real fill can differ a lot from the close.

## Close-to-close candles

LuSE publishes closing prices, not intraday highs and lows. We build *close-to-close candles* (open = previous close), so range-based tools such as ATR, ADX and candlestick patterns measure day-to-day movement instead of intraday range.`,
  },
  {
    slug: "what-is-the-lasi",
    title: "What is the LuSE All Share Index (LASI)?",
    excerpt: "A quick guide to Zambia's benchmark equity index and how to use it.",
    category: "Market Basics",
    content: `The **LuSE All Share Index (LASI)** tracks the overall performance of shares listed on the Lusaka Securities Exchange. It is the benchmark used throughout this platform for relative-strength rankings, index contributors and market breadth.

## Market capitalisation and Shoprite

LuSE reports market capitalisation both *including* and *excluding* Shoprite Holdings, because Shoprite's dual listing makes it much larger than the rest of the market. Our Market Info screen shows both.

## Using LASI

- Compare any stock's return to LASI on the **Relative Strength** screen.
- See which stocks moved the index on **Index Contributors**.
- Track the share of advancing vs declining stocks on **Advance / Decline**.`,
  },
  {
    slug: "backtesting-without-code",
    title: "Backtesting without code: build your first LuSE strategy",
    excerpt: "Step-by-step: build, test and refine a moving-average strategy on Zanaco in under five minutes.",
    category: "Backtesting",
    content: `## 1. Build

Open the **Basic Backtester**, pick a stock (for example ZNCO) and a template such as *Moving average crossover*. Choose a 20-day fast and 50-day slow average.

## 2. Backtest

Run it. The engine buys on the close after the fast average crosses above the slow one and sells on the reverse cross, charging LuSE fees on both sides.

## 3. Refine

Read the metrics: total return, CAGR, max drawdown, win rate, expectancy and profit factor. Compare against buy-and-hold and the T-bill benchmark.

## 4. Go advanced

The **Advanced Backtester** lets you combine conditions (e.g. *RSI(14) < 30 AND close > SMA(200)*), add stop-loss and take-profit levels, and test across several symbols at once. Every trade is saved to your journal automatically.`,
  },
];
