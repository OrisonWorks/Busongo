import { ImageResponse } from "next/og";
import { plainCards, plainFacts, type Topic } from "@/lib/plain-facts";
import { isLocale, t } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { brand } from "@/config/brand";

export const dynamic = "force-dynamic";

/** One Kwacha Today card as a square picture that can be forwarded on WhatsApp. */
export async function GET(req: Request, { params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const q = new URL(req.url).searchParams.get("lang");
  const l = isLocale(q) ? q : "en";
  const f = await plainFacts();
  const c = plainCards(f, l, [topic as Topic])[0];
  if (!c) return new Response("Not found", { status: 404 });
  const host = brand.siteUrl.replace(/^https?:\/\//, "");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#070b14", color: "#e6ebf5", padding: 72, fontSize: 40 }}>
        <div style={{ display: "flex", color: "#10b981", fontSize: 34, fontWeight: 700 }}>{`${brand.name} · ${t(l, "title")}`}</div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 52, fontWeight: 700 }}>{c.title}</div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 132, fontWeight: 800, color: "#ffffff" }}>{c.big}</div>
        <div style={{ display: "flex", marginTop: 24, lineHeight: 1.35 }}>{c.line}</div>
        {c.month && <div style={{ display: "flex", marginTop: 20, color: "#8a96b0", fontSize: 34 }}>{c.month}</div>}
        <div style={{ display: "flex", flexGrow: 1 }} />
        <div style={{ display: "flex", color: "#8a96b0", fontSize: 26 }}>{`${f.updated ? t(l, "updated", { date: fmtDate(f.updated) }) + " · " : ""}${t(l, "disclaimer")}`}</div>
        <div style={{ display: "flex", marginTop: 12, color: "#10b981", fontSize: 30 }}>{`${host}/kwacha-today`}</div>
      </div>
    ),
    { width: 1080, height: 1080, headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
