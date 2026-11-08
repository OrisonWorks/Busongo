export type NavItem = { href: string; label: string; desc?: string };
export type NavGroup = { label: string; items: NavItem[] };

export const PRODUCTS: NavGroup[] = [
  { label: "Backtesting", items: [
    { href: "/backtester", label: "Basic Backtester", desc: "Test proven templates on any LuSE stock in seconds" },
    { href: "/backtester/advanced", label: "Advanced Backtester", desc: "Combine any indicators, stops and multi-stock portfolios" },
    { href: "/strategies", label: "My Strategies", desc: "Saved and shared strategies" },
    { href: "/journal", label: "Trade Journal", desc: "Log trades and review your performance" },
  ] },
  { label: "Research", items: [
    { href: "/scanner", label: "Scanner", desc: "Scan LuSE with no-code technical rules" },
    { href: "/fundamentals", label: "Fundamentals", desc: "Valuation, profitability and dividend screener" },
    { href: "/sens", label: "SENS Announcements", desc: "Company announcements, results and notices" },
    { href: "/aichat", label: "AI Assistant", desc: "Ask questions about LuSE, bonds and strategies" },
  ] },
  { label: "Markets", items: [
    { href: "/market", label: "Market Terminal", desc: "LASI, movers, breadth, heatmap and turnover" },
    { href: "/fixed-income", label: "Fixed Income", desc: "T-bills, GRZ bonds and the yield curve" },
    { href: "/macro", label: "Macro Dashboard", desc: "Policy rate, inflation, interbank and kwacha" },
    { href: "/crypto", label: "Crypto", desc: "Charts and backtests for major cryptocurrencies" },
    { href: "/crypto/kwacha", label: "Kwacha & Stablecoins", desc: "Crypto in ZMW, USDT/ZMW P2P premium, stablecoin vs T-bill yields" },
  ] },
  { label: "Tools", items: [
    { href: "/tools/gann", label: "Gann Tools", desc: "Square of 9, Gann angles and time cycles" },
    { href: "/tools/smc", label: "Smart Money Concepts", desc: "Market structure, order blocks and fair-value gaps" },
    { href: "/tools/pivots", label: "Pivot Levels", desc: "Classic pivot, support and resistance levels" },
    { href: "/tools/relative-strength", label: "Relative Strength", desc: "Performance vs LASI over any window" },
    { href: "/tools/correlation", label: "Correlation Matrix", desc: "How LuSE stocks move together" },
    { href: "/tools/seasonality", label: "Seasonality", desc: "Average monthly returns" },
    { href: "/calendar", label: "Calendars", desc: "Holidays, auctions, results and dividends" },
    { href: "/watchlist", label: "Watchlist", desc: "Track your stocks and run scans on them" },
    { href: "/alerts", label: "Alerts", desc: "Get notified when a price or volume level is hit" },
  ] },
];

export const SOLUTIONS: NavItem[] = [
  { href: "/solutions#investors", label: "Long-term investors", desc: "Dividends, valuation and fundamentals" },
  { href: "/solutions#traders", label: "Active traders", desc: "Scanners, signals and backtests after fees" },
  { href: "/solutions#fixed-income", label: "Fixed-income investors", desc: "T-bill and bond auction analytics" },
  { href: "/solutions#institutions", label: "Pension funds & asset managers", desc: "Data exports and portfolio research" },
  { href: "/solutions#students", label: "Students & educators", desc: "Learn markets with real Zambian data" },
];

export const RESOURCES: NavItem[] = [
  { href: "/blog", label: "Blog", desc: "Guides and market research" },
  { href: "/videos", label: "Videos", desc: "Walkthroughs and tutorials" },
  { href: "/reference", label: "Reference", desc: "Indicator glossary, fees and market hours" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export const SIDEBAR: NavGroup[] = [
  { label: "Overview", items: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/market", label: "Market Terminal" },
    { href: "/stocks", label: "All Stocks" },
    { href: "/watchlist", label: "Watchlist" },
  ] },
  { label: "Backtest", items: [
    { href: "/backtester", label: "Basic Backtester" },
    { href: "/backtester/advanced", label: "Advanced Backtester" },
    { href: "/strategies", label: "My Strategies" },
    { href: "/journal", label: "Journal" },
    { href: "/paper", label: "Paper Trading" },
  ] },
  { label: "Research", items: [
    { href: "/scanner", label: "Scanner" },
    { href: "/fundamentals", label: "Fundamentals" },
    { href: "/sens", label: "SENS" },
    { href: "/aichat", label: "AI Assistant" },
  ] },
  { label: "Fixed Income", items: [
    { href: "/fixed-income", label: "Overview" },
    { href: "/fixed-income/yield-curve", label: "Yield Curve" },
    { href: "/fixed-income/tbills", label: "T-Bill Auctions" },
    { href: "/fixed-income/bonds", label: "Bond Auctions" },
    { href: "/fixed-income/corporate", label: "Listed Bonds" },
    { href: "/fixed-income/calculator", label: "Calculators" },
    { href: "/macro", label: "Macro" },
  ] },
  { label: "Tools", items: [
    { href: "/tools/gann", label: "Gann" },
    { href: "/tools/smc", label: "Smart Money" },
    { href: "/tools/pivots", label: "Pivots" },
    { href: "/tools/relative-strength", label: "Relative Strength" },
    { href: "/tools/correlation", label: "Correlation" },
    { href: "/tools/seasonality", label: "Seasonality" },
    { href: "/calendar", label: "Calendars" },
    { href: "/alerts", label: "Alerts" },
  ] },
  { label: "Crypto", items: [{ href: "/crypto", label: "Crypto Markets" }, { href: "/crypto/kwacha", label: "Kwacha & Stablecoins" }] },
];
