"use server";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, isAdminEmail, verifyPassword } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { brand } from "@/config/brand";

export type FormState = { error?: string; ok?: string } | undefined;
const safeNext = (n: FormDataEntryValue | null) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().regex(/^(\+?260|0)?[79]\d{8}$/, "Enter a Zambian mobile number, e.g. 0971234567").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const p = registerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { name, email, phone, password } = p.data;
  if (await prisma.user.findUnique({ where: { email } })) return { error: "An account with this email already exists. Sign in instead." };
  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash: await hashPassword(password), role: isAdminEmail(email) ? "ADMIN" : "USER" },
  });
  await createSession(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(String(fd.get("password") || ""), user.passwordHash))) return { error: "Incorrect email or password." };
  if (isAdminEmail(email) && user.role !== "ADMIN") await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  await createSession(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(24).toString("hex");
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetExpires: new Date(Date.now() + 3600_000) } });
    const link = `${brand.siteUrl}/reset-password?token=${token}`;
    await sendMail(email, `Reset your ${brand.name} password`, `<p>Click to reset your password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`);
  }
  return { ok: "If that email has an account, a reset link is on its way." };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") || "");
  const pw = String(fd.get("password") || "");
  if (pw.length < 8) return { error: "Password must be at least 8 characters" };
  const user = await prisma.user.findFirst({ where: { resetToken: token, resetExpires: { gt: new Date() } } });
  if (!user) return { error: "This reset link is invalid or has expired." };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(pw), resetToken: null, resetExpires: null } });
  await createSession(user.id);
  redirect("/dashboard");
}
