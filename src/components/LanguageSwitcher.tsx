"use client";
import { useId } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, LOCALES, type Locale } from "@/lib/i18n";

export const setLang = (v: string) => { document.cookie = `${LANG_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`; };

export default function LanguageSwitcher({ value, label }: { value: Locale; label: string }) {
  const router = useRouter();
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-muted">{label}</label>
      <select id={id} className="input w-auto text-base" value={value} onChange={(e) => { setLang(e.target.value); router.refresh(); }}>
        {LOCALES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
      </select>
    </div>
  );
}
