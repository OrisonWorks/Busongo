import { NextResponse } from "next/server";
import { getProvider, settle } from "@/lib/pay";

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const p = getProvider((await params).provider);
  if (!p) return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  const body = await req.text();
  const ev = await p.verifyWebhook(req, body);
  if (!ev) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  await settle(ev.reference, ev.status, ev.externalRef);
  return NextResponse.json({ ok: true });
}
