import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { CloudQuestPanel } from "@/components/CloudQuestPanel";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { MetricList } from "@/components/MetricList";
import { ScanDeltaCard } from "@/components/ScanDeltaCard";
import { SkillTree } from "@/components/SkillTree";
import type { AccountSnapshot } from "@/lib/auth";
import type { CloudQuestState } from "@/lib/cloud-progression-server";
import type { RepositoryAnalysis } from "@/lib/domain";
import { evidenceLabel, getDictionary, questCopy, type Locale } from "@/lib/i18n";

function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatUtc(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso));
}

export function RepositoryDashboard({ analysis, locale, account, cloudQuestState }: { analysis: RepositoryAnalysis; locale: Locale; account: AccountSnapshot; cloudQuestState: CloudQuestState }) {
  const { repository, progression } = analysis;
  const t = getDictionary(locale);
  const quest = questCopy(analysis.quest, locale);
  const visibleEvidence = analysis.evidence.slice(0, 9);
  const completedObjectives = analysis.quest.objectives.filter((objective) => objective.completed).length;
  const questProgress = analysis.quest.objectives.length > 0
    ? Math.round((completedObjectives / analysis.quest.objectives.length) * 100)
    : 0;
  const rescanPath = `/analyze/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;

  return (
    <main className="dashboard-shell">
      <header className="topbar dashboard-top">
        <Brand />
        <div className="topbar-cluster">
          <div className="live-chip"><span className="status-dot" /> {t.dashboard.deepScan}</div>
          <LocaleSwitcher locale={locale} />
          <AccountControl account={account} locale={locale} />
          <Link className="ghost compact" href="/analyze">{t.common.analyzeAnother}</Link>
        </div>
      </header>

      <section className="repo-summary-bar">
        <div>
          <span className="micro-label">{t.dashboard.analyzedRepo}</span>
          <h1>{repository.fullName}</h1>
          <p>{repository.description ?? t.dashboard.noDescription}</p>
        </div>
        <div className="repo-summary-stats">
          <span><b>{formatNumber(repository.stars, locale)}</b> {t.dashboard.stars}</span>
          <span><b>{formatNumber(repository.forks, locale)}</b> {t.dashboard.forks}</span>
          <span><b>{repository.fileCount}</b> {t.dashboard.files}</span>
          <a href={repository.url} target="_blank" rel="noreferrer">{t.common.openGithub}</a>
          <form method="get" action={rescanPath}>
            <input type="hidden" name="rescan" value="1" />
            <button className="rescan-button" type="submit">↻ {t.common.rescan}</button>
          </form>
        </div>
      </section>

      {repository.treeTruncated ? <div className="analysis-warning">{t.dashboard.warning}</div> : null}
      <ScanDeltaCard analysis={analysis} locale={locale} />

      <section className="dashboard-grid">
        <aside className="panel profile-panel">
          <div className="micro-label">{t.dashboard.build}</div>
          <div className="avatar-orb">{repository.owner.slice(0, 1).toUpperCase()}</div>
          <h1>{repository.name}</h1>
          <p className="muted">{repository.primaryLanguage ?? t.dashboard.multiLanguage} / {repository.defaultBranch}</p>
          <div className="level-block"><span>{t.dashboard.buildLevel}</span><strong>{progression.level}</strong><small>{progression.currentXp.toLocaleString(locale)} / {progression.nextLevelXp.toLocaleString(locale)} XP</small></div>
          <MetricList metrics={analysis.metrics} locale={locale} />
          <div className="language-stack"><span className="micro-label">{t.dashboard.languageMap}</span>{analysis.languages.slice(0, 5).map((language) => <div className="language-row" key={language.name}><span>{language.name}</span><b>{language.percent}%</b></div>)}</div>
        </aside>

        <section className="panel graph-panel">
          <div className="panel-head"><div><span className="micro-label">{t.dashboard.constellation}</span><h2>{t.dashboard.evidenceMap}</h2></div><span className="live-chip">{analysis.skills.filter((skill) => skill.progress > 0).length} {t.dashboard.detected}</span></div>
          <SkillTree skills={analysis.skills} evidence={analysis.evidence} locale={locale} repositoryUrl={repository.url} defaultBranch={repository.defaultBranch} quest={analysis.quest} />
          <div className="graph-legend"><span><i className="legend-core" /> {t.dashboard.primary}</span><span><i /> {t.dashboard.graphDetected}</span><span><i className="legend-lock" /> {t.dashboard.noEvidenceYet}</span></div>
        </section>

        <aside className="side-stack">
          <section className="panel quest-panel">
            <div className="micro-label">{t.dashboard.nextQuest}</div><div className="quest-icon">⌁</div><h2>{quest.title}</h2><p>{quest.description}</p>
            <ol className="quest-criteria quest-criteria-live">
              {quest.criteria.map((criterion, index) => {
                const objective = analysis.quest.objectives[index];
                const done = objective?.completed === true;
                return <li key={criterion} className={done ? "objective-done" : "objective-pending"}><span className="objective-state">{done ? `✓ ${t.common.completed}` : `○ ${t.common.pending}`}</span>{criterion}</li>;
              })}
            </ol>
            <div className="quest-progress"><span style={{ width: `${questProgress}%` }} /></div><div className="quest-meta"><span>{completedObjectives} / {quest.criteria.length} {t.common.objectives}</span><strong>+{analysis.quest.xpReward} XP</strong></div><CloudQuestPanel account={account} repositoryFullName={repository.fullName} quest={analysis.quest} state={cloudQuestState} locale={locale} />
          </section>

          <section className="panel evidence-panel">
            <div className="panel-head"><div><span className="micro-label">{t.dashboard.verifiable}</span><h2>{t.dashboard.evidence}</h2></div></div>
            {visibleEvidence.length > 0 ? (
              <ul>{visibleEvidence.map((item, i) => <li key={item.id}><span>{String(i + 1).padStart(2, "0")}</span><p>{evidenceLabel(item, locale)}{item.sourcePath ? <small>{item.sourcePath}</small> : null}</p><b>✓</b></li>)}</ul>
            ) : <p className="empty-evidence">{t.dashboard.emptyEvidence}</p>}
          </section>
        </aside>
      </section>
      <footer className="analysis-footer">{t.dashboard.analyzed}: {formatUtc(analysis.analyzedAt, locale)} · {t.dashboard.footerEngine} v0.9</footer>
    </main>
  );
}
