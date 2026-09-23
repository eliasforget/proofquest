import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { RepositoryAnalysisExperience } from "@/components/RepositoryAnalysisExperience";
import { getAccountSnapshot } from "@/lib/auth";
import { getCloudQuestStates, saveCloudScan } from "@/lib/cloud-progression-server";
import { analyzePublicRepository, GitHubAnalysisError } from "@/lib/github";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export const runtime = "nodejs";

export default async function RepositoryAnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ rescan?: string }>;
}) {
  const [{ owner, repo }, query, locale, account] = await Promise.all([params, searchParams, getLocale(), getAccountSnapshot()]);
  const t = getDictionary(locale);
  const fresh = query.rescan === "1";

  try {
    const analysis = await analyzePublicRepository(owner, repo, { fresh });
    await saveCloudScan(account, analysis);
    const cloudQuestStates = await getCloudQuestStates(account, analysis);
    return <RepositoryAnalysisExperience analysis={analysis} locale={locale} account={account} cloudQuestStates={cloudQuestStates} />;
  } catch (error) {
    const status = error instanceof GitHubAnalysisError ? error.status : undefined;
    const message = status === 400 ? t.analyze.errors.invalid : status === 404 ? t.analyze.errors.notFound : status === 403 ? t.analyze.errors.rateLimit : t.analyze.errors.generic;

    return (
      <main className="site-shell analyze-page">
        <header className="topbar"><Brand /><div className="topbar-cluster"><div className="top-actions">{t.analyze.failedStatus}</div><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
        <section className="analysis-error-card">
          <span className="micro-label">GITHUB ANALYZER</span>
          <h1>{t.analyze.failedTitle}</h1>
          <p>{message}</p>
          <div className="hero-actions">
            <Link className="cta" href="/analyze">{t.analyze.tryAnother} <span>→</span></Link>
            <a className="ghost" href={`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`} target="_blank" rel="noreferrer">{t.common.openGithub}</a>
          </div>
        </section>
      </main>
    );
  }
}
