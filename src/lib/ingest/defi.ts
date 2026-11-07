import { prisma } from "../db";

const STABLES = new Set(["USDC", "USDT", "DAI", "USDS", "PYUSD", "USDT0", "SUSDE", "USDE", "SUSDS", "SDAI"]);
const PROJECTS = new Set(["aave-v3", "compound-v3", "spark-savings", "sparklend", "maple", "morpho-blue", "ethena-usde", "jupiter-lend", "sky-lending", "fluid-lending", "kamino-lend", "justlend", "venus-core-pool"]);

type Pool = { pool: string; project: string; chain: string; symbol: string; tvlUsd: number; apy: number | null; apyBase: number | null; apyReward: number | null; stablecoin: boolean; ilRisk: string; exposure: string; outlier: boolean };

/** Daily snapshot of the largest single-asset stablecoin lending/savings yields from DefiLlama. */
export async function ingestStableYields(top = 25) {
  const r = await fetch("https://yields.llama.fi/pools");
  if (!r.ok) throw new Error(`DefiLlama ${r.status}`);
  const { data } = (await r.json()) as { data: Pool[] };
  const pools = data
    .filter((p) => p.stablecoin && p.exposure === "single" && p.ilRisk === "no" && !p.outlier && STABLES.has(p.symbol.toUpperCase()) && PROJECTS.has(p.project) && p.tvlUsd >= 50e6 && p.apy != null && p.apy > 0 && p.apy < 30)
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, top);
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (const p of pools) {
    const d = { project: p.project, chain: p.chain, symbol: p.symbol, apy: p.apy as number, apyBase: p.apyBase, apyReward: p.apyReward, tvlUsd: p.tvlUsd };
    await prisma.stableYield.upsert({ where: { date_pool: { date, pool: p.pool } }, update: d, create: { date, pool: p.pool, ...d } });
  }
  return { pools: pools.length };
}
