import AuthForm from "@/components/AuthForm";
import { brand } from "@/config/brand";
import { sendContact } from "./actions";
export const metadata = { title: "Contact" };
export default function Page() {
  return (
    <div className="mx-auto grid max-w-[1000px] gap-10 px-4 py-16 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold">Get in touch</h1>
        <p className="mt-3 text-muted">Questions about data, plans or partnerships? Message us and we&apos;ll reply within one business day.</p>
        <div className="mt-6 space-y-2 text-sm">
          <div>📍 {brand.address}</div>
          <div>✉️ <a href={`mailto:${brand.email}`} className="text-brand">{brand.email}</a></div>
          <div>💬 <a href={`https://wa.me/${brand.whatsapp.replace(/\D/g, "")}`} className="text-brand">WhatsApp {brand.whatsapp}</a></div>
        </div>
      </div>
      <div className="card p-6">
        <AuthForm action={sendContact} submit="Send message" fields={[{ name: "firstName", label: "First name", required: false }, { name: "lastName", label: "Last name", required: false }, { name: "email", label: "Email", type: "email" }, { name: "message", label: "Message" }]} />
      </div>
    </div>
  );
}
