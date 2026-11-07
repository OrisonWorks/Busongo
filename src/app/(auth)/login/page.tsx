import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { login } from "../actions";

export const metadata = { title: "Sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Sign in to your account</p>
      <AuthForm action={login} submit="Sign in" hidden={{ next }} fields={[{ name: "email", label: "Email", type: "email" }, { name: "password", label: "Password", type: "password" }]} />
      <div className="mt-4 flex justify-between text-sm text-muted">
        <Link href="/forgot-password" className="hover:text-fg">Forgot password?</Link>
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-brand">Create account</Link>
      </div>
    </>
  );
}
