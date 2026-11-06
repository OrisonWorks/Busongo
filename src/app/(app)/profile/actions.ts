"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import type { FormState } from "@/app/(auth)/actions";

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const name = String(fd.get("name") || "").trim().slice(0, 80);
  const phone = String(fd.get("phone") || "").trim();
  if (phone && !/^(\+?260|0)?[79]\d{8}$/.test(phone)) return { error: "Enter a Zambian mobile number" };
  await prisma.user.update({ where: { id: u.id }, data: { name: name || null, phone: phone || null } });
  revalidatePath("/profile");
  return { ok: "Profile saved." };
}
export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  if (!(await verifyPassword(String(fd.get("current") || ""), u.passwordHash))) return { error: "Current password is incorrect" };
  const pw = String(fd.get("password") || "");
  if (pw.length < 8) return { error: "New password must be at least 8 characters" };
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pw) } });
  return { ok: "Password changed." };
}
