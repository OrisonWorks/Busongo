import { NextResponse } from "next/server";
import { SERIES } from "@/lib/feed";
import { brand } from "@/config/brand";

export function GET() {
  return NextResponse.json({
    docs: `${brand.siteUrl}/data`,
    series: SERIES.map((s) => ({ id: s.id, title: s.title, unit: s.unit, source: s.source, json: `${brand.siteUrl}/api/v1/${s.id}`, csv: `${brand.siteUrl}/api/v1/${s.id}.csv`, embed: `${brand.siteUrl}/embed/${s.id}` })),
  }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=3600" } });
}
