import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { UA } from "../ingest/luse";

function privateIp(ip: string) {
  const v = ip.toLowerCase().replace(/^::ffff:/, "");
  if (isIP(v) === 4) {
    const [a, b] = v.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

/** Reject non-http(s) URLs and hosts that resolve to private, loopback or link-local addresses. */
export async function assertPublicUrl(raw: string) {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only http(s) URLs are allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("URL must point to a public host");
  return u;
}

export async function pdfTextFromBuffer(buf: ArrayBuffer | Uint8Array, maxChars = 24000) {
  const pdf = await getDocumentProxy(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text as string).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxChars);
}

const isPdf = (b: Uint8Array) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;

/** Download a PDF. LuSE sits behind Cloudflare, so fall back to a headless browser when plain HTTP is refused. */
export async function fetchPdf(url: string): Promise<Uint8Array> {
  await assertPublicUrl(url);
  try {
    let next = url;
    for (let hop = 0; hop < 5; hop++) {
      const r = await fetch(next, { redirect: "manual", headers: { "User-Agent": UA, Accept: "application/pdf,*/*" } });
      const loc = r.headers.get("location");
      if (r.status >= 300 && r.status < 400 && loc) { next = (await assertPublicUrl(new URL(loc, next).href)).href; continue; }
      if (r.ok) {
        const b = new Uint8Array(await r.arrayBuffer());
        if (isPdf(b)) return b;
      }
      break;
    }
  } catch {}
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(new URL(url).origin, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    const r = await ctx.request.get(url, { timeout: 60000, maxRedirects: 0 });
    const b = new Uint8Array(await r.body());
    if (!r.ok() || !isPdf(b)) throw new Error(`Could not download PDF (${r.status()})`);
    return b;
  } finally {
    await browser.close();
  }
}
