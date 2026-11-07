import AuthForm from "@/components/AuthForm";
import { resetPassword } from "../actions";

export const metadata = { title: "Choose a new password" };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Choose a new password</h1>
      <AuthForm action={resetPassword} submit="Save password" hidden={{ token }} fields={[{ name: "password", label: "New password", type: "password" }]} />
    </>
  );
}
