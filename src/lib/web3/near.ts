import "server-only";
import { Account, JsonRpcProvider } from "near-api-js";

const mainnet = process.env.NEAR_NETWORK === "mainnet";
export const NEAR = {
  network: mainnet ? "mainnet" : "testnet",
  rpc: process.env.NEAR_RPC_URL || (mainnet ? "https://rpc.mainnet.fastnear.com" : "https://rpc.testnet.fastnear.com"),
  wallet: process.env.NEAR_WALLET_URL || (mainnet ? "https://app.mynearwallet.com" : "https://testnet.mynearwallet.com"),
  explorer: mainnet ? "https://nearblocks.io" : "https://testnet.nearblocks.io",
  social: mainnet ? "social.near" : "v1.social08.testnet",
  /** NEP-413 recipient: wallets show it and it is bound into the signature. */
  recipient: process.env.NEAR_SIGNIN_RECIPIENT || "busongo",
  signer: process.env.NEAR_ACCOUNT_ID || "",
  merchant: process.env.NEAR_MERCHANT_ACCOUNT || process.env.NEAR_ACCOUNT_ID || "",
  tokens: {
    USDC: mainnet ? "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1" : "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af",
    USDT: mainnet ? "usdt.tether-token.near" : "usdt.fakes.testnet",
  } as Record<"USDC" | "USDT", string>,
};
export type Stablecoin = keyof typeof NEAR.tokens;
export const anchoringEnabled = () => !!(process.env.NEAR_ACCOUNT_ID && process.env.NEAR_PRIVATE_KEY);
export const stablePaymentsEnabled = () => !!NEAR.merchant;
export const txUrl = (h: string) => `${NEAR.explorer}/txns/${h}`;
export const accountUrl = (a: string) => `${NEAR.explorer}/address/${a}`;

async function rpc<T>(method: string, params: unknown): Promise<T> {
  const body = JSON.stringify({ jsonrpc: "2.0", id: "busongo", method, params });
  let r = await fetch(NEAR.rpc, { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" });
  if (r.status === 429 || r.status >= 500) {
    await new Promise((ok) => setTimeout(ok, 1000));
    r = await fetch(NEAR.rpc, { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" });
  }
  const j = await r.json().catch(() => null);
  if (!j) throw new Error(`NEAR RPC unavailable (HTTP ${r.status})`);
  if (j.error) throw new Error(j.error.cause?.name || j.error.message || "NEAR RPC error");
  return j.result as T;
}

export async function view<T>(contract: string, method: string, args: object = {}): Promise<T> {
  const r = await rpc<{ result: number[] }>("query", { request_type: "call_function", finality: "final", account_id: contract, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString("base64") });
  return JSON.parse(Buffer.from(r.result).toString());
}

/** True when `publicKey` is a full-access key of `accountId` (i.e. the signer controls the account). */
export async function hasFullAccessKey(accountId: string, publicKey: string) {
  try {
    const k = await rpc<{ permission: unknown }>("query", { request_type: "view_access_key", finality: "final", account_id: accountId, public_key: publicKey });
    return k.permission === "FullAccess";
  } catch {
    return false;
  }
}

const decimalsCache = new Map<string, number>();
export async function ftDecimals(contract: string) {
  if (!decimalsCache.has(contract)) decimalsCache.set(contract, (await view<{ decimals: number }>(contract, "ft_metadata")).decimals);
  return decimalsCache.get(contract)!;
}
export const toUnits = (amount: number, decimals: number) => BigInt(Math.round(amount * 100)) * BigInt(10) ** BigInt(decimals) / BigInt(100);

type TxResult = {
  status: { SuccessValue?: string; Failure?: unknown };
  transaction: { signer_id: string; receiver_id: string; actions: ({ FunctionCall?: { method_name: string; args: string; deposit: string } } | string)[] };
  receipts_outcome: { outcome: { status: { Failure?: unknown } } }[];
};

/** Verify a finalised `ft_transfer` of at least `minUnits` of `token` to `receiver` carrying `memo`. */
export async function verifyFtTransfer(o: { txHash: string; sender: string; token: string; receiver: string; minUnits: bigint; memo: string }) {
  let tx: TxResult;
  try {
    tx = await rpc<TxResult>("tx", { tx_hash: o.txHash, sender_account_id: o.sender, wait_until: "FINAL" });
  } catch (e) {
    return { ok: false as const, error: `Transaction not found for ${o.sender} (${String((e as Error).message)})` };
  }
  if (!("SuccessValue" in tx.status) || tx.receipts_outcome.some((r) => r.outcome.status.Failure)) return { ok: false as const, error: "The transaction failed on-chain" };
  if (tx.transaction.receiver_id !== o.token) return { ok: false as const, error: "The transaction was not sent to the stablecoin contract" };
  for (const a of tx.transaction.actions) {
    const fc = typeof a === "object" ? a.FunctionCall : undefined;
    if (!fc || fc.method_name !== "ft_transfer") continue;
    const args = JSON.parse(Buffer.from(fc.args, "base64").toString()) as { receiver_id?: string; amount?: string; memo?: string };
    if (args.receiver_id !== o.receiver) continue;
    if (args.memo !== o.memo) return { ok: false as const, error: `Memo must be ${o.memo}` };
    if (BigInt(args.amount ?? "0") < o.minUnits) return { ok: false as const, error: "Amount is lower than the invoice" };
    return { ok: true as const, amount: args.amount! };
  }
  return { ok: false as const, error: `No ft_transfer to ${o.receiver} in this transaction` };
}

/** Write `{ busongo: { proofs: { <hash>: <kind> } } }` to NEAR Social under the Busongo account; returns the transaction hash. */
export async function anchorHash(hash: string, kind: string) {
  const account = new Account(NEAR.signer, new JsonRpcProvider({ url: NEAR.rpc }), process.env.NEAR_PRIVATE_KEY as `ed25519:${string}`);
  const r = await account.callFunctionRaw({
    contractId: NEAR.social, methodName: "set",
    args: { data: { [NEAR.signer]: { busongo: { proofs: { [hash]: kind } } } } },
    deposit: BigInt("10000000000000000000000"), gas: BigInt("100000000000000"),
  });
  return (r as unknown as { transaction: { hash: string } }).transaction.hash;
}

/** Read back what NEAR Social holds for `hash` under the Busongo account (independent check). */
export async function readAnchor(hash: string) {
  const r = await view<Record<string, { busongo?: { proofs?: Record<string, string> } }>>(NEAR.social, "get", { keys: [`${NEAR.signer}/busongo/proofs/${hash}`] });
  return r[NEAR.signer]?.busongo?.proofs?.[hash] ?? null;
}
