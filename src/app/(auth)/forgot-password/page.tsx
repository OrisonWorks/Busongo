import AuthForm from "@/components/AuthForm";
import { forgotPassword } from "../actions";

export const metadata = { title: "Forgot password" };
export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-muted">We&apos;ll email you a reset link.</p>
      <AuthForm action={forgotPassword} submit="Send reset link" fields={[{ name: "email", label: "Email", type: "email" }]} />
    </>
  );
}
