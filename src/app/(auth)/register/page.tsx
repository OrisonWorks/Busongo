import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { register } from "../actions";
import { PAYMENTS_ENABLED } from "@/config/features";

export const metadata = { title: "Create account" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold">Create your free account</h1>
      <p className="mb-6 mt-1 text-sm text-muted">{PAYMENTS_ENABLED ? "No card needed. Upgrade any time with Airtel Money or MTN MoMo." : "Free for everyone. No card needed."}</p>
      <AuthForm action={register} submit="Create account" hidden={{ next }} fields={[
        { name: "name", label: "Full name" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Mobile number (optional)", type: "tel", placeholder: "0971234567", required: false },
        { name: "password", label: "Password", type: "password", placeholder: "At least 8 characters" },
      ]} />
      <p className="mt-4 text-sm text-muted">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand">Sign in</Link></p>
    </>
  );
}
