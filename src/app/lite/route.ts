import { cookies } from "next/headers";
import { plainCards, plainFacts } from "@/lib/plain-facts";
import { isLocale, LANG_COOKIE, LOCALES, t, type Key, type Locale } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { brand } from "@/config/brand";
import { kwachaTodayMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Kwacha Today as one small HTML page with no scripts, images or web fonts, for slow connections and basic phones. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("lang");
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  const l: Locale = isLocale(q) ? q : isLocale(c) ? c : "en";
  const tt = (k: Key, v?: Record<string, string | number>) => esc(t(l, k, v));
  let body: string;
  try {
    const f = await plainFacts();
    const cards = plainCards(f, l);
    const share = kwachaTodayMessage(f, l);
    body = `${f.updated ? `<p class="m">${tt("updated", { date: fmtDate(f.updated) })}</p>` : ""}
${l !== "en" ? `<p class="n">${tt("draft")}</p>` : ""}
${cards.map((x) => `<h2>${esc(x.title)}</h2><p class="b">${esc(x.big)}</p><p>${esc(x.line)}</p>${x.month ? `<p class="m">${esc(x.month)}</p>` : ""}<details><summary>${tt("whatMeans")}</summary><p>${esc(x.explain)}</p></details>`).join("\n") || `<p>${tt("noData")}</p>`}
<p><a href="https://wa.me/?text=${encodeURIComponent(share)}">${tt("share")}</a></p>`;
  } catch {
    body = `<p>${tt("noData")}</p>`;
  }
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${tt("title")} | ${esc(brand.name)}</title><meta name="description" content="${tt("subtitle")}">
<style>body{font:18px/1.5 system-ui,sans-serif;max-width:40em;margin:0 auto;padding:1em;background:#fff;color:#111}h1{font-size:1.6em;margin:.2em 0}h2{font-size:1.15em;margin:1.4em 0 0;border-top:1px solid #ccc;padding-top:.8em}.b{font-size:1.8em;font-weight:700;margin:0}.m{color:#555}.n{background:#fff4d6;padding:.5em}a{color:#06603f}summary{color:#06603f}nav a{margin-right:.6em}</style></head>
<body><p><a href="/">${esc(brand.name)}</a></p><h1>${tt("title")}</h1><p>${tt("subtitle")}</p>
<nav aria-label="${tt("language")}">${LOCALES.map((x) => (x.code === l ? `<b>${x.name}</b>` : `<a href="/lite?lang=${x.code}" hreflang="${x.code}">${x.name}</a>`)).join(" ")}</nav>
${body}
<p class="m">${tt("disclaimer")} ${tt("source")}</p><p><a href="/kwacha-today">${esc(brand.name)} — ${tt("title")}</a></p></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, max-age=300", vary: "Cookie" } });
}
