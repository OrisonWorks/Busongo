"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function toggleVote(itemId: string) {
  const u = await requireUser("/roadmap");
  const item = await prisma.roadmapItem.findUnique({ where: { id: itemId }, select: { status: true } });
  if (!item || item.status !== "open") return;
  const where = { itemId_userId: { itemId, userId: u.id } };
  if (await prisma.roadmapVote.findUnique({ where })) await prisma.roadmapVote.delete({ where });
  else await prisma.roadmapVote.create({ data: { itemId, userId: u.id } }).catch(() => null);
  revalidatePath("/roadmap");
}
