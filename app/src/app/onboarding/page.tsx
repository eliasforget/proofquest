import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { RepositoryPicker } from "@/components/RepositoryPicker";
import { getAccountSnapshot } from "@/lib/auth";
import { getAuthCopy } from "@/lib/auth-i18n";
import { listPublicRepositoriesForUser } from "@/lib/github-account";
import { getLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const locale = await getLocale();
  const copy = getAuthCopy(locale);
  const account = await getAccountSnapshot();

  if (!account.signedIn || !account.username) {
    return (
      <main className="site-shell onboarding-shell">
        <header className="topbar"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
        <section className="onboarding-intro panel">
          <span className="eyebrow">PROOFQUEST / GITHUB</span>
          <h1>{copy.loginTitle}</h1>
          <p>{copy.loginBody}</p>
          <div className="hero-actions"><AccountControl account={account} locale={locale} /><Link className="ghost" href="/analyze">Analyse manuelle</Link></div>
        </section>
      </main>
    );
  }

  const repositories = await listPublicRepositoriesForUser(account.username);

  return (
    <main className="dashboard-shell onboarding-shell">
      <header className="topbar dashboard-top"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
      <section className="onboarding-heading">
        <span className="eyebrow">GITHUB / @{account.username}</span>
        <h1>{copy.onboardingTitle}</h1>
        <p>{copy.onboardingIntro}</p>
      </section>
      <RepositoryPicker repositories={repositories} locale={locale} />
    </main>
  );
}
