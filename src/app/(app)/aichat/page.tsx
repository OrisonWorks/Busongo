import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import { aiConfigured } from "@/lib/ai";
import Chat from "@/components/Chat";
import { Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "AI Assistant" };
export default async function Page() {
  const u = await requireUser("/aichat");
  const [hist, usage] = await Promise.all([prisma.chatMessage.findMany({ where: { userId: u.id }, orderBy: { createdAt: "asc" }, take: 50 }), getUsage(u, "aiMessages")]);
  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Ask about LuSE stocks, GRZ bonds, T-bills, indicators and strategies. Answers use the latest market data." />
      {!aiConfigured() && <Notice>The AI provider is not configured on this server yet.</Notice>}
      <Chat initial={hist.map((h) => ({ role: h.role, content: h.content }))} usage={{ used: usage.used, limit: usage.limit }} />
    </div>
  );
}
