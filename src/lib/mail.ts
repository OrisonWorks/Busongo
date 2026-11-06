import "server-only";
import { brand } from "@/config/brand";

// Sends via Resend when RESEND_API_KEY is set; otherwise logs (development).
export async function sendMail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail] to=${to} subject=${subject}\n${html}`);
    return { ok: true, dev: true };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM || `${brand.name} <noreply@${new URL(brand.siteUrl).hostname}>`, to, subject, html }),
  });
  return { ok: r.ok, dev: false };
}
