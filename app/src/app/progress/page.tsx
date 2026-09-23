import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ProfileVisibilityToggle } from "@/components/ProfileVisibilityToggle";
import { getAccountSnapshot } from "@/lib/auth";
import { getAuthCopy } from "@/lib/auth-i18n";
import { getLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function levelFromXp(totalXp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, totalXp) / 450)) + 1);
}

type ScanSnapshot = {
  skills?: Array<{
    id?: string;
    name?: string;
    progress?: number;
    level?: number;
  }>;
  evidenceCount?: number;
};

export default async function ProgressPage() {
  const locale = await getLocale();
  const copy = getAuthCopy(locale);
  const account = await getAccountSnapshot();

  if (!account.signedIn || !account.userId) {
    return (
      <main className="site-shell onboarding-shell">
        <header className="topbar"><Brand /><LocaleSwitcher locale={locale} /></header>
        <section className="onboarding-intro panel"><h1>{copy.loginTitle}</h1><p>{copy.loginBody}</p><AccountControl account={account} locale={locale} /></section>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: progress }, { data: quests }, { data: scans }] = await Promise.all([
    supabase.from("player_progress").select("total_xp,updated_at").eq("user_id", account.userId).maybeSingle(),
    supabase.from("quest_history").select("id,repository_full_name,kind,xp_reward,completed_at").eq("user_id", account.userId).order("completed_at", { ascending: false }).limit(12),
    supabase.from("repository_scans").select("repository_full_name,analyzed_at,snapshot").eq("user_id", account.userId).order("analyzed_at", { ascending: false }).limit(60),
  ]);

  const totalXp = Number(progress?.total_xp ?? 0);
  const level = levelFromXp(totalXp);

  const latestByRepository = new Map<string, { repository: string; analyzedAt: string; snapshot: ScanSnapshot }>();
  for (const row of scans ?? []) {
    const repository = String(row.repository_full_name);
    if (latestByRepository.has(repository)) continue;
    latestByRepository.set(repository, {
      repository,
      analyzedAt: String(row.analyzed_at),
      snapshot: (row.snapshot ?? {}) as ScanSnapshot,
    });
  }

  const latestScans = Array.from(latestByRepository.values());
  const skillBuckets = new Map<string, { name: string; total: number; count: number }>();
  let totalEvidence = 0;

  for (const scan of latestScans) {
    totalEvidence += Number(scan.snapshot.evidenceCount ?? 0);
    for (const skill of scan.snapshot.skills ?? []) {
      if (!skill.id || typeof skill.progress !== "number") continue;
      const existing = skillBuckets.get(skill.id) ?? {
        name: skill.name || skill.id,
        total: 0,
        count: 0,
      };
      existing.total += skill.progress;
      existing.count += 1;
      skillBuckets.set(skill.id, existing);
    }
  }

  const globalSkills = Array.from(skillBuckets.entries())
    .map(([id, bucket]) => ({
      id,
      name: bucket.name,
      progress: Math.round(bucket.total / Math.max(1, bucket.count)),
      repositories: bucket.count,
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 8);

  return (
    <main className="dashboard-shell progress-page-shell">
      <header className="topbar dashboard-top"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>

      <section className="progress-cloud-hero panel">
        <div>
          <span className="eyebrow">PROOFQUEST IDENTITY</span>
          <h1>{account.displayName || account.username}</h1>
          <p>@{account.username}</p>
        </div>
        <div className="public-level-orb"><span>LEVEL</span><strong>{level}</strong><small>{totalXp.toLocaleString(locale)} XP</small></div>
        <div className="progress-cloud-actions">
          <ProfileVisibilityToggle userId={account.userId} initialPublic={Boolean(account.isPublic)} locale={locale} />
          {account.isPublic && account.username ? <Link className="ghost compact" href={`/u/${account.username}`}>{copy.publicProfile} ↗</Link> : null}
        </div>
      </section>

      <section className="progress-overview-grid">
        <article className="panel progression-stat-card">
          <span className="micro-label">REPOSITORIES ANALYSÉS</span>
          <strong>{latestScans.length}</strong>
          <p>Dernier scan conservé pour chaque dépôt.</p>
        </article>
        <article className="panel progression-stat-card">
          <span className="micro-label">PREUVES CARTOGRAPHIÉES</span>
          <strong>{totalEvidence}</strong>
          <p>Signaux techniques du dernier état de vos dépôts.</p>
        </article>
        <article className="panel progression-stat-card">
          <span className="micro-label">QUÊTES VÉRIFIÉES</span>
          <strong>{quests?.length ?? 0}</strong>
          <p>Récompenses attribuées uniquement après vérification GitHub.</p>
        </article>
      </section>

      <section className="panel global-skill-panel">
        <div className="panel-head">
          <div><span className="micro-label">GLOBAL SKILL MATRIX</span><h2>Votre carte multi-repositories</h2></div>
          <span className="live-chip">{globalSkills.length} SKILLS</span>
        </div>
        {globalSkills.length ? (
          <div className="global-skill-grid">
            {globalSkills.map((skill) => (
              <article key={skill.id}>
                <div className="global-skill-orb"><strong>{Math.max(1, Math.ceil(skill.progress / 10))}</strong><span>LV</span></div>
                <div className="global-skill-copy">
                  <div><strong>{skill.name}</strong><span>{skill.progress}%</span></div>
                  <div className="global-skill-bar"><i style={{ width: `${skill.progress}%` }} /></div>
                  <small>{skill.repositories} dépôt{skill.repositories > 1 ? "s" : ""}</small>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="progress-empty">Analysez un premier dépôt connecté pour construire votre carte globale.</p>}
      </section>

      <section className="progress-two-column">
        <section className="panel progress-history-panel">
          <div className="panel-head"><div><span className="micro-label">{copy.recentQuests}</span><h2>{quests?.length ?? 0}</h2></div></div>
          {quests?.length ? (
            <div className="public-quest-grid">
              {quests.map((quest) => (
                <article key={String(quest.id)}>
                  <span className="public-quest-check">✓</span>
                  <div><strong>{String(quest.kind).toUpperCase()}</strong><p>{quest.repository_full_name}</p><small>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(quest.completed_at))}</small></div>
                  <b>+{quest.xp_reward} XP</b>
                </article>
              ))}
            </div>
          ) : <p className="progress-empty">{copy.noHistory}</p>}
        </section>

        <section className="panel progress-repository-panel">
          <div className="panel-head"><div><span className="micro-label">SCAN HISTORY</span><h2>{latestScans.length}</h2></div></div>
          {latestScans.length ? (
            <div className="progress-repository-list">
              {latestScans.slice(0, 10).map((scan) => (
                <article key={scan.repository}>
                  <div><strong>{scan.repository}</strong><small>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(scan.analyzedAt))}</small></div>
                  <Link href={`/analyze/${scan.repository.split("/").map(encodeURIComponent).join("/")}`}>Ouvrir →</Link>
                </article>
              ))}
            </div>
          ) : <p className="progress-empty">Aucun scan cloud enregistré.</p>}
        </section>
      </section>
    </main>
  );
}
