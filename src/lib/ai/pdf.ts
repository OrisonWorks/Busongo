import "server-only";
import http from "node:http";
import https from "node:https";
import { lookup } from "node:dns";
import { isIP, type LookupFunction } from "node:net";
import { extractText, getDocumentProxy } from "unpdf";
import { UA } from "../ingest/luse";

export const MAX_PDF_BYTES = 25 * 1024 * 1024;
/** Hosts behind Cloudflare that need the headless-browser fallback. The browser is never pointed anywhere else. */
const BROWSER_HOSTS = new Set(["luse.co.zm", "www.luse.co.zm"]);

export async function pdfTextFromBuffer(buf: ArrayBuffer | Uint8Array, maxChars = 24000) {
  const pdf = await getDocumentProxy(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text as string).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxChars);
}

const isPdf = (b: Uint8Array) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;

function privateIp(ip: string) {
  const v = ip.toLowerCase().replace(/^::ffff:/, "");
  if (isIP(v) === 4) {
    const [a, b] = v.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

const PRIVATE = "URL must point to a public host";

/** DNS lookup used for the actual connection, so the address that is checked is the one connected to (no DNS rebinding). */
const safeLookup = ((host: string, opts: object, cb: (e: Error | null, a: unknown, f?: number) => void) => {
  lookup(host, { ...opts, all: true }, (err, addrs) => {
    if (err) return cb(err, "", 0);
    if (!addrs.length || addrs.some((a) => privateIp(a.address))) return cb(new Error(PRIVATE), "", 0);
    if ((opts as { all?: boolean }).all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}) as unknown as LookupFunction;

export function assertPublicUrl(raw: string) {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only http(s) URLs are allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && privateIp(host)) throw new Error(PRIVATE);
  return u;
}

const TOO_BIG = "PDF is larger than 25 MB";

function get(url: URL, maxBytes: number): Promise<{ status: number; location?: string; body?: Uint8Array }> {
  return new Promise((resolve, reject) => {
    const req = (url.protocol === "https:" ? https : http).get(url, { lookup: safeLookup, timeout: 60000, headers: { "User-Agent": UA, Accept: "application/pdf,*/*" } }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) { res.resume(); return resolve({ status, location: res.headers.location }); }
      if (Number(res.headers["content-length"] || 0) > maxBytes) return req.destroy(new Error(TOO_BIG));
      const chunks: Buffer[] = [];
      let n = 0;
      res.on("data", (c: Buffer) => { n += c.length; if (n > maxBytes) req.destroy(new Error(TOO_BIG)); else chunks.push(c); });
      res.on("end", () => resolve({ status, body: new Uint8Array(Buffer.concat(chunks)) }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("Timed out downloading PDF")));
    req.on("error", reject);
  });
}

/** Download a PDF from a public host, capped at `maxBytes`. LuSE sits behind Cloudflare, so it alone falls back to a headless browser. */
export async function fetchPdf(url: string, maxBytes = MAX_PDF_BYTES): Promise<Uint8Array> {
  let u = assertPublicUrl(url);
  let lastErr: unknown = null;
  try {
    for (let hop = 0; hop < 5; hop++) {
      const r = await get(u, maxBytes);
      if (r.location) { u = assertPublicUrl(new URL(r.location, u).href); continue; }
      if (r.status >= 200 && r.status < 300 && r.body && isPdf(r.body)) return r.body;
      break;
    }
  } catch (e) {
    if (String(e).includes(TOO_BIG) || String(e).includes(PRIVATE)) throw e;
    lastErr = e;
  }
  if (!BROWSER_HOSTS.has(u.hostname)) throw new Error(lastErr ? `Could not download PDF: ${String(lastErr).slice(0, 120)}` : "That URL did not return a PDF");
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(u.origin, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    const r = await ctx.request.get(u.href, { timeout: 60000, maxRedirects: 0 });
    if (Number(r.headers()["content-length"] || 0) > maxBytes) throw new Error(TOO_BIG);
    const b = new Uint8Array(await r.body());
    if (b.length > maxBytes) throw new Error(TOO_BIG);
    if (!r.ok() || !isPdf(b)) throw new Error(`Could not download PDF (${r.status()})`);
    return b;
  } finally {
    await browser.close();
  }
}
