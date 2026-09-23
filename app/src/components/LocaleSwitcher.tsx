"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { getDictionary, localeLabels, supportedLocales, type Locale } from "@/lib/i18n";

const names: Record<Locale, string> = { fr: "Français", en: "English", de: "Deutsch", es: "Español" };

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const label = getDictionary(locale).common.language;

  function changeLocale(nextLocale: Locale) {
    document.cookie = `pq-locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <label className="locale-switcher" title={names[locale]}>
      <span className="sr-only">{label}</span>
      <select value={locale} onChange={(event: ChangeEvent<HTMLSelectElement>) => changeLocale(event.target.value as Locale)} aria-label={label}>
        {supportedLocales.map((item) => <option key={item} value={item}>{localeLabels[item]} — {names[item]}</option>)}
      </select>
    </label>
  );
}
