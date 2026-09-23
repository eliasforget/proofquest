import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("pq-locale")?.value;
  return isLocale(value) ? value : defaultLocale;
}
