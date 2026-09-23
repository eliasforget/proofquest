import Link from "next/link";
import { AnalyzeRepositoryForm } from "@/components/AnalyzeRepositoryForm";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export default async function AnalyzePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="site-shell analyze-page">
      <header className="topbar"><Brand /><div className="topbar-cluster"><div className="top-actions">{t.analyze.status}</div><LocaleSwitcher locale={locale} /></div></header>
      <section className="analyze-entry">
        <div className="eyebrow">{t.analyze.eyebrow}</div>
        <h1>{t.analyze.title}</h1>
        <p>{t.analyze.intro}</p>
        <AnalyzeRepositoryForm locale={locale} />
        <div className="analysis-note">
          <strong>{t.analyze.noteTitle}</strong>
          <p>{t.analyze.note1}</p>
          <p>{t.analyze.note2}</p>
        </div>
        <Link className="ghost compact" href="/dashboard">{t.analyze.demo}</Link>
      </section>
    </main>
  );
}
