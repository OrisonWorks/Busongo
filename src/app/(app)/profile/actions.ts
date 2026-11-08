"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import type { FormState } from "@/app/(auth)/actions";
import { isWalletOnly } from "@/lib/web3/session";
import { handleError, normalizeHandle } from "@/lib/handles";

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const name = String(fd.get("name") || "").trim().slice(0, 80);
  const phone = String(fd.get("phone") || "").trim();
  if (phone && !/^(\+?260|0)?[79]\d{8}$/.test(phone)) return { error: "Enter a Zambian mobile number" };
  const handle = normalizeHandle(String(fd.get("handle") || ""));
  if (handle) { const e = handleError(handle); if (e) return { error: e }; }
  const bio = String(fd.get("bio") || "").trim().slice(0, 280);
  const profilePublic = fd.get("profilePublic") === "on";
  if (profilePublic && !handle) return { error: "Choose a handle to make your profile public" };
  if (handle && (await prisma.user.findFirst({ where: { handle, NOT: { id: u.id } }, select: { id: true } }))) return { error: `@${handle} is already taken` };
  try {
    await prisma.user.update({ where: { id: u.id }, data: { name: name || null, phone: phone || null, handle: handle || null, bio: bio || null, profilePublic } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { error: `@${handle} is already taken` };
    throw e;
  }
  revalidatePath("/profile");
  if (u.handle) revalidatePath(`/u/${u.handle}`);
  if (handle) revalidatePath(`/u/${handle}`);
  return { ok: "Profile saved." };
}
export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  if (isWalletOnly(u)) return { error: "This account signs in with a wallet and has no password" };
  if (!(await verifyPassword(String(fd.get("current") || ""), u.passwordHash))) return { error: "Current password is incorrect" };
  const pw = String(fd.get("password") || "");
  if (pw.length < 8) return { error: "New password must be at least 8 characters" };
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pw) } });
  return { ok: "Password changed." };
}
