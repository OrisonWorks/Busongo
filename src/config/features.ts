/** Crypto pages (markets, Kwacha & Stablecoins) are hidden unless NEXT_PUBLIC_ENABLE_CRYPTO="1". Crypto data stays available to the backtester and scanner as demo data. */
export const CRYPTO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CRYPTO === "1";
