/** Crypto pages (markets, Kwacha & Stablecoins) are hidden unless NEXT_PUBLIC_ENABLE_CRYPTO="1". Crypto data stays available to the backtester and scanner as demo data. */
export const CRYPTO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CRYPTO === "1";
/** Simulated paper trading. Off by default: no trading of any kind on the platform. */
export const PAPER_TRADING_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PAPER_TRADING === "1";
/** Plans, pricing and checkout (Mobile Money and stablecoins). Off: Busongo is free and everyone gets every tool, with fair-use limits. */
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === "1";
/** Wallet sign-in/linking and the Busongo Ledger (fingerprints of strategies, backtests, daily market data and roadmap tallies recorded on NEAR). On unless NEXT_PUBLIC_ENABLE_WEB3="0". Payments stay behind PAYMENTS_ENABLED. */
export const WEB3_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WEB3 !== "0";
