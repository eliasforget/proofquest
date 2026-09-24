import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getAccountSnapshot, getPublicProfile } from "@/lib/auth";
import { getAuthCopy } from "@/lib/auth-i18n";
import { questTitleFor, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const labels = {
  fr: {
    identity: "PROFIL DE PREUVES PUBLIC",
    verified: "PREUVES VÉRIFIÉES",
    repositories: "DÉPÔTS CARTOGRAPHIÉS",
    evidence: "SIGNAUX TECHNIQUES",
    skills: "CONSTELLATION GLOBALE",
    skillsBody: "Compétences agrégées à partir du dernier scan public de chaque dépôt.",
    activity: "PREUVES RÉCENTES",
    repositoriesTitle: "Repositories observés",
    noData: "Aucune preuve publique disponible pour le moment.",
    proofCommit: "Commit preuve",
    scans: "scans",
    repositoriesWord: "dépôts",
    notFoundTitle: "Profil introuvable",
    notFoundBody: "Ce profil est privé ou n'existe pas.",
    commitBacked: "adossées à un commit GitHub",
    repositoryEvidence: "preuves de repository",
    serverVerified: "vérifié côté serveur",
    skillsWord: "compétences",
    evidenceMap: "CARTE DE PREUVES",
    verifiedChip: "VÉRIFIÉ",
    achievements: "ACHIEVEMENTS",
    achievementsBody: "Badges calculés uniquement à partir de preuves publiques vérifiées.",
    details: "Voir la preuve",
  },
  en: {
    identity: "PUBLIC PROOF PROFILE",
    verified: "VERIFIED PROOFS",
    repositories: "MAPPED REPOSITORIES",
    evidence: "TECHNICAL SIGNALS",
    skills: "GLOBAL CONSTELLATION",
    skillsBody: "Skills aggregated from the latest public scan of each repository.",
    activity: "RECENT PROOFS",
    repositoriesTitle: "Observed repositories",
    noData: "No public proof is available yet.",
    proofCommit: "Proof commit",
    scans: "scans",
    repositoriesWord: "repositories",
    notFoundTitle: "Profile not found",
    notFoundBody: "This profile is private or does not exist.",
    commitBacked: "backed by a GitHub commit",
    repositoryEvidence: "repository evidence",
    serverVerified: "server verified",
    skillsWord: "skills",
    evidenceMap: "EVIDENCE MAP",
    verifiedChip: "VERIFIED",
    achievements: "ACHIEVEMENTS",
    achievementsBody: "Badges computed only from verified public proof.",
    details: "View proof",
  },
  de: {
    identity: "ÖFFENTLICHES NACHWEISPROFIL",
    verified: "VERIFIZIERTE NACHWEISE",
    repositories: "KARTIERTE REPOSITORIES",
    evidence: "TECHNISCHE SIGNALE",
    skills: "GLOBALE KONSTELLATION",
    skillsBody: "Aggregierte Skills aus dem letzten öffentlichen Scan jedes Repositories.",
    activity: "AKTUELLE NACHWEISE",
    repositoriesTitle: "Beobachtete Repositories",
    noData: "Noch keine öffentlichen Nachweise verfügbar.",
    proofCommit: "Nachweis-Commit",
    scans: "Scans",
    repositoriesWord: "Repositories",
    notFoundTitle: "Profil nicht gefunden",
    notFoundBody: "Dieses Profil ist privat oder existiert nicht.",
    commitBacked: "durch einen GitHub-Commit belegt",
    repositoryEvidence: "Repository-Nachweise",
    serverVerified: "serverseitig verifiziert",
    skillsWord: "Skills",
    evidenceMap: "NACHWEISKARTE",
    verifiedChip: "VERIFIZIERT",
    achievements: "ACHIEVEMENTS",
    achievementsBody: "Badges werden nur aus verifizierten öffentlichen Nachweisen berechnet.",
    details: "Nachweis ansehen",
  },
  es: {
    identity: "PERFIL PÚBLICO DE PRUEBAS",
    verified: "PRUEBAS VERIFICADAS",
    repositories: "REPOSITORIOS MAPEADOS",
    evidence: "SEÑALES TÉCNICAS",
    skills: "CONSTELACIÓN GLOBAL",
    skillsBody: "Competencias agregadas desde el último análisis público de cada repositorio.",
    activity: "PRUEBAS RECIENTES",
    repositoriesTitle: "Repositorios observados",
    noData: "Todavía no hay pruebas públicas disponibles.",
    proofCommit: "Commit de prueba",
    scans: "análisis",
    repositoriesWord: "repositorios",
    notFoundTitle: "Perfil no encontrado",
    notFoundBody: "Este perfil es privado o no existe.",
    commitBacked: "respaldadas por un commit de GitHub",
    repositoryEvidence: "pruebas del repositorio",
    serverVerified: "verificado en el servidor",
    skillsWord: "competencias",
    evidenceMap: "MAPA DE PRUEBAS",
    verifiedChip: "VERIFICADO",
    achievements: "LOGROS",
    achievementsBody: "Insignias calculadas únicamente a partir de pruebas públicas verificadas.",
    details: "Ver prueba",
  },
} as const;

type PublicScanSnapshot = {
  repository?: {
    fullName?: string;
    primaryLanguage?: string | null;
  };
  skills?: Array<{
    id?: string;
    name?: string;
    progress?: number;
    level?: number;
  }>;
  evidenceCount?: number;
  analyzedAt?: string;
};

type QuestRow = {
  id: string;
  repository_full_name: string;
  kind: string;
  xp_reward: number;
  completed_at: string;
  verified_at: string | null;
  verified_commit_sha: string | null;
};

function levelFromXp(totalXp: number) {
  return Math.max(
    1,
    Math.floor(Math.sqrt(Math.max(0, totalXp) / 450)) + 1,
  );
}

function shortSha(value: string | null) {
  return value ? value.slice(0, 7) : null;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [{ username }, locale, account] = await Promise.all([
    params,
    getLocale(),
    getAccountSnapshot(),
  ]);
  const t = labels[locale];
  const authCopy = getAuthCopy(locale);
  const profile = await getPublicProfile(username);

  if (!profile) {
    return (
      <main className="site-shell public-profile-shell">
        <header className="topbar">
          <Brand />
          <div className="topbar-cluster">
            <LocaleSwitcher locale={locale} />
            <AccountControl account={account} locale={locale} />
          </div>
        </header>
        <section className="analysis-error-card">
          <h1>{t.notFoundTitle}</h1>
          <p>{t.notFoundBody}</p>
          <Link className="cta" href="/">
            {authCopy.backHome} →
          </Link>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const [
    { data: progress },
    { data: questRows },
    { data: scanRows },
  ] = await Promise.all([
    supabase
      .from("player_progress")
      .select("total_xp")
      .eq("user_id", profile.user_id)
      .maybeSingle(),
    supabase
      .from("quest_history")
      .select(
        "id,repository_full_name,kind,xp_reward,completed_at,verified_at,verified_commit_sha",
      )
      .eq("user_id", profile.user_id)
      .order("completed_at", { ascending: false })
      .limit(24),
    supabase
      .from("repository_scans")
      .select("repository_full_name,analyzed_at,snapshot")
      .eq("user_id", profile.user_id)
      .order("analyzed_at", { ascending: false })
      .limit(80),
  ]);

  const quests = (questRows ?? []) as QuestRow[];
  const totalXp = Number(progress?.total_xp ?? 0);

  const latestByRepository = new Map<
    string,
    {
      repository: string;
      analyzedAt: string;
      snapshot: PublicScanSnapshot;
    }
  >();

  for (const row of scanRows ?? []) {
    const repository = String(row.repository_full_name);
    if (latestByRepository.has(repository)) continue;

    latestByRepository.set(repository, {
      repository,
      analyzedAt: String(row.analyzed_at),
      snapshot: (row.snapshot ?? {}) as PublicScanSnapshot,
    });
  }

  const repositories = Array.from(latestByRepository.values());
  const skillBuckets = new Map<
    string,
    { name: string; total: number; count: number }
  >();
  let evidenceCount = 0;

  for (const scan of repositories) {
    evidenceCount += Number(scan.snapshot.evidenceCount ?? 0);

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

  const skills = Array.from(skillBuckets.entries())
    .map(([id, value]) => ({
      id,
      name: value.name,
      progress: Math.round(value.total / Math.max(1, value.count)),
      repositories: value.count,
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 10);

  const verifiedQuests = quests.filter(
    (quest) => Boolean(quest.verified_commit_sha),
  );
  const verifiedKinds = new Set(verifiedQuests.map((quest) => quest.kind));

  const achievementCopy = {
    fr: {
      first: ["PREMIÈRE PREUVE", "Valider une première quête avec un commit GitHub."],
      triple: ["TRIPLE PREUVE", "Valider au moins 3 quêtes vérifiées."],
      polyrepo: ["POLYREPO", "Cartographier au moins 2 repositories."],
      xp: ["2500 XP", "Atteindre 2 500 XP vérifiés."],
      shield: ["SHIELD READY", "Valider une preuve de sécurité."],
      constellation: ["CONSTELLATION", "Cartographier au moins 7 compétences."],
    },
    en: {
      first: ["FIRST PROOF", "Verify a first quest with a GitHub commit."],
      triple: ["TRIPLE PROOF", "Verify at least 3 quests."],
      polyrepo: ["POLYREPO", "Map at least 2 repositories."],
      xp: ["2500 XP", "Reach 2,500 verified XP."],
      shield: ["SHIELD READY", "Verify a security proof."],
      constellation: ["CONSTELLATION", "Map at least 7 skills."],
    },
    de: {
      first: ["ERSTER NACHWEIS", "Eine erste Quest mit GitHub-Commit verifizieren."],
      triple: ["DREIFACH-NACHWEIS", "Mindestens 3 Quests verifizieren."],
      polyrepo: ["POLYREPO", "Mindestens 2 Repositories kartieren."],
      xp: ["2500 XP", "2.500 verifizierte XP erreichen."],
      shield: ["SHIELD READY", "Einen Security-Nachweis verifizieren."],
      constellation: ["KONSTELLATION", "Mindestens 7 Skills kartieren."],
    },
    es: {
      first: ["PRIMERA PRUEBA", "Verificar una primera misión con un commit de GitHub."],
      triple: ["TRIPLE PRUEBA", "Verificar al menos 3 misiones."],
      polyrepo: ["POLYREPO", "Mapear al menos 2 repositorios."],
      xp: ["2500 XP", "Alcanzar 2.500 XP verificados."],
      shield: ["SHIELD READY", "Verificar una prueba de seguridad."],
      constellation: ["CONSTELACIÓN", "Mapear al menos 7 competencias."],
    },
  } as const;

  const ac = achievementCopy[locale];
  const achievements: Array<{
    id: string;
    unlocked: boolean;
    copy: readonly [string, string];
  }> = [
    { id: "first", unlocked: verifiedQuests.length >= 1, copy: ac.first },
    { id: "triple", unlocked: verifiedQuests.length >= 3, copy: ac.triple },
    { id: "polyrepo", unlocked: repositories.length >= 2, copy: ac.polyrepo },
    { id: "xp", unlocked: totalXp >= 2500, copy: ac.xp },
    { id: "shield", unlocked: verifiedKinds.has("security"), copy: ac.shield },
    { id: "constellation", unlocked: skills.length >= 7, copy: ac.constellation },
  ];

  return (
    <main className="dashboard-shell public-profile-shell proof-profile-v11">
      <header className="topbar dashboard-top">
        <Brand />
        <div className="topbar-cluster">
          <LocaleSwitcher locale={locale} />
          <AccountControl account={account} locale={locale} />
        </div>
      </header>

      <section className="proof-hero panel">
        <div className="proof-identity">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="public-avatar-fallback">
              {profile.username.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <span className="eyebrow">{t.identity}</span>
            <h1>{profile.display_name || profile.username}</h1>
            <p>@{profile.username}</p>
            {profile.bio ? <div className="proof-bio">{profile.bio}</div> : null}
          </div>
        </div>

        <div className="proof-level-orbit">
          <div className="proof-level-ring" />
          <div className="public-level-orb">
            <span>PROOFQUEST LEVEL</span>
            <strong>{levelFromXp(totalXp)}</strong>
            <small>{totalXp.toLocaleString(locale)} XP</small>
          </div>
        </div>
      </section>

      <section className="proof-stat-grid">
        <article className="panel proof-stat-card">
          <span>{t.verified}</span>
          <strong>{verifiedQuests.length}</strong>
          <small>{t.commitBacked}</small>
        </article>
        <article className="panel proof-stat-card">
          <span>{t.repositories}</span>
          <strong>{repositories.length}</strong>
          <small>{t.repositoriesWord}</small>
        </article>
        <article className="panel proof-stat-card">
          <span>{t.evidence}</span>
          <strong>{evidenceCount}</strong>
          <small>{t.repositoryEvidence}</small>
        </article>
        <article className="panel proof-stat-card proof-stat-xp">
          <span>PROOF XP</span>
          <strong>{totalXp.toLocaleString(locale)}</strong>
          <small>{t.serverVerified}</small>
        </article>
      </section>

      <section className="panel proof-achievement-panel">
        <div className="panel-head">
          <div>
            <span className="micro-label">{t.achievements}</span>
            <h2>{achievements.filter((achievement) => achievement.unlocked).length} / {achievements.length}</h2>
            <p>{t.achievementsBody}</p>
          </div>
          <span className="live-chip">SERVER PROOF</span>
        </div>
        <div className="proof-achievement-grid">
          {achievements.map((achievement) => (
            <article
              key={achievement.id}
              className={achievement.unlocked ? "achievement-unlocked" : "achievement-locked"}
            >
              <div className="achievement-orb">
                {achievement.unlocked ? "✓" : "◇"}
              </div>
              <div>
                <strong>{achievement.copy[0]}</strong>
                <p>{achievement.copy[1]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="proof-profile-grid">
        <section className="panel proof-skill-panel">
          <div className="panel-head">
            <div>
              <span className="micro-label">{t.skills}</span>
              <h2>{skills.length} {t.skillsWord}</h2>
              <p>{t.skillsBody}</p>
            </div>
            <span className="live-chip">{t.evidenceMap}</span>
          </div>

          {skills.length ? (
            <div className="proof-skill-constellation">
              {skills.map((skill, index) => (
                <article
                  className="proof-skill-node"
                  key={skill.id}
                  style={{
                    ["--proof-index" as string]: String(index),
                  }}
                >
                  <div className="proof-skill-node-orb">
                    <strong>{Math.max(1, Math.ceil(skill.progress / 10))}</strong>
                    <span>LV</span>
                  </div>
                  <div>
                    <div className="proof-skill-line">
                      <strong>{skill.name}</strong>
                      <span>{skill.progress}%</span>
                    </div>
                    <div className="proof-skill-track">
                      <i style={{ width: `${skill.progress}%` }} />
                    </div>
                    <small>
                      {skill.repositories} {t.repositoriesWord}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="progress-empty">{t.noData}</p>
          )}
        </section>

        <aside className="panel proof-repository-panel">
          <div className="panel-head">
            <div>
              <span className="micro-label">{t.repositoriesTitle}</span>
              <h2>{repositories.length}</h2>
            </div>
          </div>

          <div className="proof-repository-stack">
            {repositories.slice(0, 10).map((scan) => (
              <article key={scan.repository}>
                <div>
                  <strong>{scan.repository}</strong>
                  <span>
                    {scan.snapshot.repository?.primaryLanguage ?? "MULTI"}
                  </span>
                </div>
                <small>{formatDate(scan.analyzedAt, locale)}</small>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="panel proof-timeline-panel">
        <div className="panel-head">
          <div>
            <span className="micro-label">{t.activity}</span>
            <h2>{verifiedQuests.length}</h2>
          </div>
          <span className="live-chip">{t.verifiedChip}</span>
        </div>

        {verifiedQuests.length ? (
          <div className="proof-timeline">
            {verifiedQuests.slice(0, 12).map((quest) => {
              const proofUrl = quest.verified_commit_sha
                ? `https://github.com/${quest.repository_full_name}/commit/${quest.verified_commit_sha}`
                : null;
              const [proofOwner, proofRepo] = quest.repository_full_name.split("/");
              const detailsHref =
                proofOwner && proofRepo
                  ? `/u/${profile.username}/proof/${encodeURIComponent(quest.kind)}/${encodeURIComponent(proofOwner)}/${encodeURIComponent(proofRepo)}`
                  : null;

              return (
                <article key={quest.id}>
                  <div className="proof-timeline-marker">✓</div>
                  <div className="proof-timeline-copy">
                    <div>
                      <span>{questTitleFor(quest.kind as Parameters<typeof questTitleFor>[0], locale)}</span>
                      <strong>{quest.repository_full_name}</strong>
                    </div>
                    <small>
                      {formatDate(
                        quest.verified_at ?? quest.completed_at,
                        locale,
                      )}
                    </small>
                  </div>
                  <div className="proof-timeline-reward">
                    <strong>+{quest.xp_reward} XP</strong>
                    {detailsHref ? (
                      <Link href={detailsHref}>{t.details} →</Link>
                    ) : null}
                    {proofUrl ? (
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.proofCommit} {shortSha(quest.verified_commit_sha)} ↗
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="progress-empty">{t.noData}</p>
        )}
      </section>
    </main>
  );
}
