import Link from "next/link";
import { brand } from "@/config/brand";
import { PRODUCTS, RESOURCES } from "@/config/nav";
import { PAYMENTS_ENABLED } from "@/config/features";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:grid-cols-6">
        <div className="md:col-span-2">
          <div className="text-lg font-bold">{brand.name}</div>
          <p className="mt-2 max-w-sm text-sm text-muted">{brand.description}</p>
          <div className="mt-4 space-y-1 text-sm text-muted">
            <div>{brand.address}</div>
            <a className="block hover:text-fg" href={`mailto:${brand.email}`}>{brand.email}</a>
            <a className="block hover:text-fg" href={`https://wa.me/${brand.whatsapp.replace(/\D/g, "")}`}>WhatsApp {brand.whatsapp}</a>
          </div>
        </div>
        {PRODUCTS.slice(0, 3).map((g) => (
          <div key={g.label}>
            <div className="mb-2 text-sm font-semibold">{g.label}</div>
            {g.items.map((i) => <Link key={i.href} href={i.href} className="block py-0.5 text-sm text-muted hover:text-fg">{i.label}</Link>)}
          </div>
        ))}
        <div>
          <div className="mb-2 text-sm font-semibold">Company</div>
          {RESOURCES.map((i) => <Link key={i.href} href={i.href} className="block py-0.5 text-sm text-muted hover:text-fg">{i.label}</Link>)}
          {PAYMENTS_ENABLED && <Link href="/pricing" className="block py-0.5 text-sm text-muted hover:text-fg">Pricing</Link>}
          <a href="/lite" className="block py-0.5 text-sm text-muted hover:text-fg">Text-only Kwacha Today</a>
          <Link href="/terms" className="block py-0.5 text-sm text-muted hover:text-fg">Terms</Link>
          <Link href="/privacy" className="block py-0.5 text-sm text-muted hover:text-fg">Privacy</Link>
          {PAYMENTS_ENABLED && <Link href="/refund" className="block py-0.5 text-sm text-muted hover:text-fg">Refund policy</Link>}
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {brand.org}. Market data from the Lusaka Securities Exchange and Bank of Zambia public releases; may be delayed. For research and education only: {brand.name} does not trade{PAYMENTS_ENABLED ? "" : ", take payments"} or give investment advice.
      </div>
    </footer>
  );
}
