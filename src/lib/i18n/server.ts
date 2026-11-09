import "server-only";
import { cookies } from "next/headers";
import { isLocale, LANG_COOKIE, type Locale } from ".";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLocale(v) ? v : "en";
}
