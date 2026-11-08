/** Crypto pages (markets, Kwacha & Stablecoins) are hidden unless NEXT_PUBLIC_ENABLE_CRYPTO="1". Crypto data stays available to the backtester and scanner as demo data. */
export const CRYPTO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CRYPTO === "1";
/** Plans, pricing and checkout (Mobile Money and stablecoins). Off: Busongo is free and everyone gets every tool, with fair-use limits. */
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === "1";
/** NEAR wallet sign-in/linking and on-chain proofs. */
export const WEB3_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WEB3 === "1";
