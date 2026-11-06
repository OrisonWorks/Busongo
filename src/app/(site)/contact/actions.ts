"use server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { FormState } from "@/app/(auth)/actions";

const s = z.object({ firstName: z.string().trim().max(80).optional(), lastName: z.string().trim().max(80).optional(), email: z.string().trim().email("Enter a valid email"), message: z.string().trim().min(5, "Please write a message").max(5000) });
export async function sendContact(_: FormState, fd: FormData): Promise<FormState> {
  const p = s.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  await prisma.contactMessage.create({ data: p.data });
  return { ok: "Thanks! We'll get back to you within one business day." };
}
