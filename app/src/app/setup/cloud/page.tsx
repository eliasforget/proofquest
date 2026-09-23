import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getAccountSnapshot } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

const callback = "https://vlgpwhcrlczyzqtdqqes.supabase.co/auth/v1/callback";

export default async function CloudSetupPage() {
  const [locale, account] = await Promise.all([getLocale(), getAccountSnapshot()]);

  return (
    <main className="site-shell onboarding-shell">
      <header className="topbar"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
      <section className="onboarding-intro panel">
        <span className="eyebrow">PROOFQUEST CLOUD / OAUTH</span>
        <h1>Brancher GitHub à ProofQuest.</h1>
        <p>La base Supabase et les politiques RLS sont déjà en place. Une OAuth App GitHub doit encore être reliée au provider GitHub de Supabase.</p>
        <ol className="cloud-setup-list">
          <li><b>1.</b><span>Créer une OAuth App GitHub avec comme callback :</span><code>{callback}</code></li>
          <li><b>2.</b><span>Dans Supabase → Authentication → Providers → GitHub, renseigner le Client ID et le Client Secret.</span></li>
          <li><b>3.</b><span>Dans Supabase → Authentication → URL Configuration, autoriser :</span><code>http://localhost:3000/auth/callback</code></li>
          <li><b>4.</b><span>Relancer ProofQuest puis utiliser « Continuer avec GitHub ».</span></li>
        </ol>
        <div className="hero-actions"><Link className="cta" href="/onboarding">Tester la connexion →</Link><Link className="ghost" href="/">Accueil</Link></div>
      </section>
    </main>
  );
}
