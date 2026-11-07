import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { UA } from "../ingest/luse";

export async function pdfTextFromBuffer(buf: ArrayBuffer | Uint8Array, maxChars = 24000) {
  const pdf = await getDocumentProxy(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text as string).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxChars);
}

const isPdf = (b: Uint8Array) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;

/** Download a PDF. LuSE sits behind Cloudflare, so fall back to a headless browser when plain HTTP is refused. */
export async function fetchPdf(url: string): Promise<Uint8Array> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/pdf,*/*" } });
    if (r.ok) {
      const b = new Uint8Array(await r.arrayBuffer());
      if (isPdf(b)) return b;
    }
  } catch {}
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(new URL(url).origin, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    const r = await ctx.request.get(url, { timeout: 60000 });
    const b = new Uint8Array(await r.body());
    if (!r.ok() || !isPdf(b)) throw new Error(`Could not download PDF (${r.status()})`);
    return b;
  } finally {
    await browser.close();
  }
}
