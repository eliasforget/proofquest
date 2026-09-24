import Link from "next/link";
import { Brand } from "@/components/Brand";
import { AccountControl } from "@/components/AccountControl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ensureCurrentProfile, getAccountSnapshot } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { getProductCopy } from "@/lib/product-i18n";
import { getAuthCopy } from "@/lib/auth-i18n";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ProfileSettings() {
  const [locale, account] = await Promise.all([getLocale(), getAccountSnapshot()]);
  const profile = account.signedIn ? await ensureCurrentProfile() : null;
  const t = getProductCopy(locale);
  return <main className="site-shell">
    <header className="topbar"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
    {profile ? <ProfileEditor locale={locale} initial={{ headline: profile.headline ?? "", bio: profile.bio ?? "", public_links: profile.public_links ?? [] }} /> : <section className="panel profile-editor"><h1>{getAuthCopy(locale).loginTitle}</h1><AccountControl account={account} locale={locale} /></section>}
    <Link className="ghost compact" href="/progress">← {t.back}</Link>
  </main>;
}
