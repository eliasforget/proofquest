import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getAccountSnapshot } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export default async function Home() {
  const [locale, account] = await Promise.all([getLocale(), getAccountSnapshot()]);
  const t = getDictionary(locale);

  return (
    <main className="site-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="topbar">
        <Brand />
        <div className="topbar-cluster"><div className="top-actions"><span className="status-dot" /> {t.home.status}</div><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div>
      </header>

      <section className="hero">
        <div className="eyebrow">{t.home.eyebrow}</div>
        <h1>{t.home.title1}<br /><span>{t.home.title2}</span></h1>
        <p>{t.home.intro}</p>
        <div className="hero-actions">
          <Link className="cta" href="/analyze">{t.home.analyze} <span>↗</span></Link>
          <Link className="ghost" href="/dashboard">{t.home.demo}</Link>
        </div>
        <div className="trust-line">
          <span>{t.home.readonly}</span><i />
          <span>{t.home.evidenceFirst}</span><i />
          <span>{t.home.noMagic}</span>
        </div>
      </section>

      <section className="orbital-preview" aria-hidden="true">
        <div className="orbit orbit-1" />
        <div className="orbit orbit-2" />
        <div className="planet core-orb">TS<span>08</span></div>
        <div className="planet satellite sat-a">REACT<span>07</span></div>
        <div className="planet satellite sat-b">CI<span>04</span></div>
        <div className="planet satellite sat-c">TEST<span>03</span></div>
      </section>

      <section className="feature-strip">
        {t.home.features.map(([title, description], index) => (
          <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{description}</p></article>
        ))}
      </section>
    </main>
  );
}
