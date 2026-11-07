# Busongo

Research, screening, backtesting and fixed-income analytics for the Zambian market — LuSE equities, BoZ government securities (GRZ bonds, T-bills, yield curve), macro rates, and crypto.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind v4 · Prisma + PostgreSQL · Playwright (LuSE scraper) · Recharts / Lightweight Charts · Vitest

## Getting started
```bash
cp .env.example .env            # fill in DATABASE_URL and AUTH_SECRET at minimum
docker run -d --name busongo-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p 5432:5432 postgres:16
npm install
npx playwright install chromium # needed for LuSE ingestion
npm run db:migrate
npm run db:seed                 # securities, sectors, blog posts
npm run ingest -- boz crypto luse
npm run dev
```
Register with an address listed in `ADMIN_EMAILS` to get access to `/admin`.

## Data sources
| Source | What | How |
|---|---|---|
| luse.co.zm | Daily equity prices, LASI, market summary, listed bonds, SENS | Headless Chromium (plain HTTP is blocked) |
| boz.zm JSON APIs | T-bill & bond auctions, MPR, inflation, interbank, OLF, USD/ZMW | `fetch` |
| data-api.binance.vision | Daily crypto candles | `fetch` |

LuSE publishes only the current session, so equity history accumulates from the first run. Load older history (and fundamentals) via CSV at `/admin`:
- Prices: `date,symbol,close,open,high,low,volume,value,trades`
- Fundamentals: `symbol,fiscalyear,revenue,grossprofit,operatingprofit,netincome,totalassets,totalliabilities,totalequity,totaldebt,cash,operatingcashflow,capex,eps,dps,sharesoutstanding,sourceurl`

## Scheduling
- `.github/workflows/ingest.yml` — weekdays after market close; runs all ingestors including LuSE (needs the `DATABASE_URL` repo secret).
- `vercel.json` cron → `/api/cron` — BoZ + crypto only (no headless browser on Vercel).

## Scripts
`npm run dev | build | start | lint | typecheck | test | db:migrate | db:seed | ingest`

## Configuration
Brand, fees and plans live in `src/config/` (`brand.ts`, `fees.ts`, `plans.ts`). LuSE fees are modelled at 1.375% per side (SEC 0.125%, LuSE 0.25%, broker 1%).

## Payments
`src/lib/pay` has a sandbox provider (default) and a generic HTTP Mobile Money aggregator (MTN / Airtel / Zamtel) enabled by `PAYMENT_CHARGE_URL` + `PAYMENT_API_KEY`. Webhooks: `POST /api/payments/<provider>` signed with HMAC-SHA256 (`PAYMENT_WEBHOOK_SECRET`). The aggregator request/response shape must be adapted to the chosen provider.
