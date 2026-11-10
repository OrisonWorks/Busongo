import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Offline", robots: { index: false } };

export default async function Page() {
  const l = await getLocale();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center" lang={l}>
      <h1 className="text-3xl font-bold">{t(l, "offlineTitle")}</h1>
      <p className="mt-3 text-lg text-muted">{t(l, "offlineBody")}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/kwacha-today" className="btn btn-primary">{t(l, "title")}</Link>
        <a href="/lite" className="btn btn-ghost">{t(l, "lite")}</a>
      </div>
    </div>
  );
}
