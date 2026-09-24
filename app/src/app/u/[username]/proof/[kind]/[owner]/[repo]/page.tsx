import { publicMetadata, publicPath, sharingLocale, type PublicRoute, type PublicSearch } from "@/lib/public-sharing";
import { ShareProof } from "@/components/ShareProof";
import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getAccountSnapshot, getPublicProfile } from "@/lib/auth";
import { questTitleFor, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<PublicRoute>; searchParams: PublicSearch }) {
  return publicMetadata(await params, await sharingLocale(searchParams));
}

const labels = {
  fr: {
    proof: "PREUVE VÉRIFIÉE",
    repository: "Repository",
    reward: "Récompense",
    verified: "Vérifiée",
    commit: "Commit GitHub",
    contribution: "CONTRIBUTION ATTRIBUÉE",
    unlocked: "OBJECTIFS DÉBLOQUÉS",
    files: "FICHIERS PERTINENTS",
    baseline: "BASELINE AU LANCEMENT",
    method: "MÉTHODE DE VÉRIFICATION",
    methodBody: "Commit GitHub attribué au compte connecté, créé après le lancement de la quête.",
    back: "Retour au profil",
    openCommit: "Ouvrir le commit",
    noData: "Aucune donnée disponible",
    notFound: "Cette preuve publique n'existe pas.",
  },
  en: {
    proof: "VERIFIED PROOF",
    repository: "Repository",
    reward: "Reward",
    verified: "Verified",
    commit: "GitHub commit",
    contribution: "ATTRIBUTED CONTRIBUTION",
    unlocked: "UNLOCKED OBJECTIVES",
    files: "RELEVANT FILES",
    baseline: "START BASELINE",
    method: "VERIFICATION METHOD",
    methodBody: "GitHub commit attributed to the connected account and created after the quest started.",
    back: "Back to profile",
    openCommit: "Open commit",
    noData: "No data available",
    notFound: "This public proof does not exist.",
  },
  de: {
    proof: "VERIFIZIERTER NACHWEIS",
    repository: "Repository",
    reward: "Belohnung",
    verified: "Verifiziert",
    commit: "GitHub-Commit",
    contribution: "ZUGEORDNETER BEITRAG",
    unlocked: "FREIGESCHALTETE ZIELE",
    files: "RELEVANTE DATEIEN",
    baseline: "START-BASELINE",
    method: "VERIFIZIERUNGSMETHODE",
    methodBody: "GitHub-Commit des verbundenen Kontos, erstellt nach dem Start der Quest.",
    back: "Zurück zum Profil",
    openCommit: "Commit öffnen",
    noData: "Keine Daten verfügbar",
    notFound: "Dieser öffentliche Nachweis existiert nicht.",
  },
  es: {
    proof: "PRUEBA VERIFICADA",
    repository: "Repositorio",
    reward: "Recompensa",
    verified: "Verificada",
    commit: "Commit de GitHub",
    contribution: "CONTRIBUCIÓN ATRIBUIDA",
    unlocked: "OBJETIVOS DESBLOQUEADOS",
    files: "ARCHIVOS RELEVANTES",
    baseline: "BASELINE INICIAL",
    method: "MÉTODO DE VERIFICACIÓN",
    methodBody: "Commit de GitHub atribuido a la cuenta conectada y creado después de iniciar la misión.",
    back: "Volver al perfil",
    openCommit: "Abrir commit",
    noData: "No hay datos disponibles",
    notFound: "Esta prueba pública no existe.",
  },
} as const;

type VerificationMetadata = {
  githubLogin?: string;
  commitUrl?: string;
  commitAuthoredAt?: string;
  relevantFiles?: string[];
  baselineCompletedObjectiveIds?: string[];
  newlyCompletedObjectiveIds?: string[];
  currentCompletedObjectiveIds?: string[];
};

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function metadataOf(value: unknown): VerificationMetadata {
  if (!value || typeof value !== "object") return {};
  const row = value as Record<string, unknown>;

  return {
    githubLogin:
      typeof row.githubLogin === "string" ? row.githubLogin : undefined,
    commitUrl:
      typeof row.commitUrl === "string" ? row.commitUrl : undefined,
    commitAuthoredAt:
      typeof row.commitAuthoredAt === "string"
        ? row.commitAuthoredAt
        : undefined,
    relevantFiles: arrayOfStrings(row.relevantFiles),
    baselineCompletedObjectiveIds: arrayOfStrings(
      row.baselineCompletedObjectiveIds,
    ),
    newlyCompletedObjectiveIds: arrayOfStrings(
      row.newlyCompletedObjectiveIds,
    ),
    currentCompletedObjectiveIds: arrayOfStrings(
      row.currentCompletedObjectiveIds,
    ),
  };
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function PublicProofPage({
  params,
  searchParams,
}: {
  searchParams: PublicSearch;
  params: Promise<{
    username: string;
    kind: string;
    owner: string;
    repo: string;
  }>;
}) {
  const [{ username, kind, owner, repo }, locale, account] =
    await Promise.all([
      params,
      sharingLocale(searchParams),
      getAccountSnapshot(),
    ]);

  const t = labels[locale];
  const profile = await getPublicProfile(username);
  const repositoryFullName = `${owner}/${repo}`;

  if (!profile) {
    return (
      <main className="site-shell public-profile-shell">
        <header className="topbar">
          <Brand />
          <LocaleSwitcher locale={locale} />
        </header>
        <section className="analysis-error-card">
          <h1>{t.notFound}</h1>
          <Link className="cta" href="/">ProofQuest →</Link>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: quest } = await supabase
    .from("quest_history")
    .select(
      "id,repository_full_name,kind,xp_reward,started_at,completed_at,verified_at,verified_commit_sha,verification_method,verification_metadata",
    )
    .eq("user_id", profile.user_id)
    .eq("repository_full_name", repositoryFullName)
    .eq("kind", kind)
    .not("verified_commit_sha", "is", null)
    .maybeSingle();

  if (!quest) {
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
          <h1>{t.notFound}</h1>
          <Link className="cta" href={`/u/${profile.username}`}>
            {t.back} →
          </Link>
        </section>
      </main>
    );
  }

  const metadata = metadataOf(quest.verification_metadata);
  const commitSha = String(quest.verified_commit_sha);
  const commitUrl =
    metadata.commitUrl ??
    `https://github.com/${quest.repository_full_name}/commit/${commitSha}`;
  const verifiedAt = String(quest.verified_at ?? quest.completed_at);
  const startedAt = String(quest.started_at);
  const kindValue = quest.kind as Parameters<typeof questTitleFor>[0];

  return (
    <main className="dashboard-shell proof-detail-shell">
      <header className="topbar dashboard-top">
        <Brand />
        <div className="topbar-cluster">
          <LocaleSwitcher locale={locale} />
          <AccountControl account={account} locale={locale} />
        </div>
      </header>

      <section className="proof-detail-hero panel">
        <div>
          <span className="eyebrow">{t.proof}</span>
          <h1>{questTitleFor(kindValue, locale)}</h1>
          <p>{quest.repository_full_name}</p>
          <ShareProof path={publicPath({ username, kind, owner, repo })} title={questTitleFor(kindValue, locale)} locale={locale} />
        </div>
        <div className="proof-detail-xp">
          <span>{t.reward}</span>
          <strong>+{quest.xp_reward}</strong>
          <small>XP</small>
        </div>
      </section>

      <section className="proof-detail-facts">
        <article className="panel">
          <span>{t.repository}</span>
          <strong>{quest.repository_full_name}</strong>
        </article>
        <article className="panel">
          <span>{t.verified}</span>
          <strong>{formatDate(verifiedAt, locale)}</strong>
        </article>
        <article className="panel">
          <span>{t.commit}</span>
          <strong>{commitSha.slice(0, 10)}</strong>
        </article>
      </section>

      <section className="proof-detail-grid">
        <section className="panel proof-detail-main">
          <div className="proof-detail-section">
            <span className="micro-label">{t.contribution}</span>
            <div className="proof-commit-card">
              <div>
                <strong>{metadata.githubLogin ? `@${metadata.githubLogin}` : profile.username}</strong>
                <code>{commitSha}</code>
                <small>
                  {metadata.commitAuthoredAt
                    ? formatDate(metadata.commitAuthoredAt, locale)
                    : formatDate(verifiedAt, locale)}
                </small>
              </div>
              <a href={commitUrl} target="_blank" rel="noreferrer">
                {t.openCommit} ↗
              </a>
            </div>
          </div>

          <div className="proof-detail-section">
            <span className="micro-label">{t.unlocked}</span>
            <div className="proof-token-list">
              {(metadata.newlyCompletedObjectiveIds ?? []).length
                ? metadata.newlyCompletedObjectiveIds?.map((objective) => (
                    <span key={objective}>✓ {objective}</span>
                  ))
                : <p>{t.noData}</p>}
            </div>
          </div>

          <div className="proof-detail-section">
            <span className="micro-label">{t.files}</span>
            <div className="proof-file-list">
              {(metadata.relevantFiles ?? []).length
                ? metadata.relevantFiles?.map((file) => (
                    <code key={file}>{file}</code>
                  ))
                : <p>{t.noData}</p>}
            </div>
          </div>
        </section>

        <aside className="panel proof-detail-side">
          <div>
            <span className="micro-label">{t.method}</span>
            <p>{t.methodBody}</p>
            <code>{String(quest.verification_method ?? "github_commit_after_start")}</code>
          </div>

          <div>
            <span className="micro-label">{t.baseline}</span>
            <div className="proof-token-list compact">
              {(metadata.baselineCompletedObjectiveIds ?? []).length
                ? metadata.baselineCompletedObjectiveIds?.map((objective) => (
                    <span key={objective}>{objective}</span>
                  ))
                : <p>{t.noData}</p>}
            </div>
          </div>

          <div>
            <span className="micro-label">START</span>
            <p>{formatDate(startedAt, locale)}</p>
          </div>

          <Link className="ghost compact" href={`/u/${profile.username}?lang=${locale}`}>
            ← {t.back}
          </Link>
        </aside>
      </section>
    </main>
  );
}
