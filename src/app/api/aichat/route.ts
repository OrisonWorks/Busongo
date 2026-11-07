import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { consume } from "@/lib/usage";
import { aiConfigured, complete, marketContext, SYSTEM, type Msg } from "@/lib/ai";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to chat." }, { status: 401 });
  const { message } = await req.json().catch(() => ({}));
  if (typeof message !== "string" || !message.trim() || message.length > 4000) return NextResponse.json({ error: "Enter a message (max 4000 characters)." }, { status: 400 });
  if (!aiConfigured()) return NextResponse.json({ error: "The AI assistant is not configured yet (AI_API_KEY missing)." }, { status: 503 });
  const u = await consume(user, "aiMessages");
  if (!u.ok) return NextResponse.json({ error: `You've used all ${u.limit} AI messages this month. Upgrade for more.` }, { status: 429 });
  const history = (await prisma.chatMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 })).reverse();
  const msgs: Msg[] = [{ role: "system", content: SYSTEM }, { role: "system", content: `Market data:\n${await marketContext()}` }, ...history.map((h) => ({ role: h.role as Msg["role"], content: h.content })), { role: "user", content: message }];
  try {
    const reply = await complete(msgs);
    await prisma.chatMessage.createMany({ data: [{ userId: user.id, role: "user", content: message }, { userId: user.id, role: "assistant", content: reply }] });
    return NextResponse.json({ reply, used: u.used, limit: u.limit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "The AI service is unavailable. Please try again." }, { status: 502 });
  }
}
