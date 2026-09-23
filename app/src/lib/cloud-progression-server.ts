import type { AccountSnapshot } from "@/lib/auth";
import type { QuestDraft, RepositoryAnalysis } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2026-03-10";

export type CloudQuestState = {
  eligible: boolean;
  active: boolean;
  completed: boolean;
  totalXp: number;
};

export type CloudQuestStates = Partial<
  Record<QuestDraft["kind"], CloudQuestState>
>;

type GitHubUser = {
  id: number;
  login: string;
};

type GitHubCommit = {
  author: { id: number; login: string } | null;
};

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "ProofQuest",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function hasPublicContribution(
  account: AccountSnapshot,
  repositoryFullName: string,
) {
  if (!account.githubUserId) return false;

  try {
    const identityResponse = await fetch(
      `${GITHUB_API}/user/${account.githubUserId}`,
      {
        headers: githubHeaders(),
        next: { revalidate: 900 },
      },
    );

    if (!identityResponse.ok) return false;

    const identity = (await identityResponse.json()) as GitHubUser;
    if (identity.id !== account.githubUserId || !identity.login) return false;

    const commitsResponse = await fetch(
      `${GITHUB_API}/repos/${repositoryFullName
        .split("/")
        .map(encodeURIComponent)
        .join("/")}/commits?author=${encodeURIComponent(identity.login)}&per_page=10`,
      {
        headers: githubHeaders(),
        next: { revalidate: 300 },
      },
    );

    if (!commitsResponse.ok) return false;

    const commits = (await commitsResponse.json()) as GitHubCommit[];
    return commits.some((commit) => commit.author?.id === account.githubUserId);
  } catch {
    return false;
  }
}

async function canAssociateRepository(
  account: AccountSnapshot,
  analysis: RepositoryAnalysis,
) {
  if (!account.userId || !account.githubUserId) return false;

  if (
    account.username &&
    analysis.repository.owner.toLowerCase() === account.username.toLowerCase()
  ) {
    return true;
  }

  const supabase = await createClient();
  const [activeResult, historyResult] = await Promise.all([
    supabase
      .from("active_quests")
      .select("id")
      .eq("user_id", account.userId)
      .eq("repository_full_name", analysis.repository.fullName)
      .limit(1),
    supabase
      .from("quest_history")
      .select("id")
      .eq("user_id", account.userId)
      .eq("repository_full_name", analysis.repository.fullName)
      .limit(1),
  ]);

  if (
    (activeResult.data?.length ?? 0) > 0 ||
    (historyResult.data?.length ?? 0) > 0
  ) {
    return true;
  }

  return hasPublicContribution(account, analysis.repository.fullName);
}

export async function getCloudQuestStates(
  account: AccountSnapshot,
  analysis: RepositoryAnalysis,
): Promise<CloudQuestStates> {
  const quests = analysis.quests.length ? analysis.quests : [analysis.quest];

  if (!account.signedIn || !account.userId || !account.githubUserId) {
    return Object.fromEntries(
      quests.map((quest) => [
        quest.kind,
        {
          eligible: false,
          active: false,
          completed: false,
          totalXp: 0,
        },
      ]),
    ) as CloudQuestStates;
  }

  const supabase = await createClient();
  const [activeResult, historyResult, progressResult] = await Promise.all([
    supabase
      .from("active_quests")
      .select("kind")
      .eq("user_id", account.userId)
      .eq("repository_full_name", analysis.repository.fullName),
    supabase
      .from("quest_history")
      .select("kind")
      .eq("user_id", account.userId)
      .eq("repository_full_name", analysis.repository.fullName),
    supabase
      .from("player_progress")
      .select("total_xp")
      .eq("user_id", account.userId)
      .maybeSingle(),
  ]);

  const activeKinds = new Set(
    (activeResult.data ?? []).map((row) => String(row.kind)),
  );
  const completedKinds = new Set(
    (historyResult.data ?? []).map((row) => String(row.kind)),
  );
  const totalXp = Number(progressResult.data?.total_xp ?? 0);

  return Object.fromEntries(
    quests.map((quest) => [
      quest.kind,
      {
        eligible: true,
        active: activeKinds.has(quest.kind),
        completed: completedKinds.has(quest.kind),
        totalXp,
      },
    ]),
  ) as CloudQuestStates;
}

export async function saveCloudScan(
  account: AccountSnapshot,
  analysis: RepositoryAnalysis,
) {
  if (!account.signedIn || !account.userId || !account.githubUserId) return;
  if (!(await canAssociateRepository(account, analysis))) return;

  const supabase = await createClient();
  const { data: latest } = await supabase
    .from("repository_scans")
    .select("analyzed_at")
    .eq("user_id", account.userId)
    .eq("repository_full_name", analysis.repository.fullName)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.analyzed_at) {
    const age = Date.now() - new Date(latest.analyzed_at).getTime();
    if (Number.isFinite(age) && age < 90_000) return;
  }

  const snapshot = {
    repository: {
      fullName: analysis.repository.fullName,
      primaryLanguage: analysis.repository.primaryLanguage,
    },
    skills: analysis.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      level: skill.level,
      progress: skill.progress,
    })),
    evidenceCount: analysis.evidence.length,
    analyzedAt: analysis.analyzedAt,
  };

  await supabase.from("repository_scans").insert({
    user_id: account.userId,
    repository_full_name: analysis.repository.fullName,
    analyzed_at: analysis.analyzedAt,
    snapshot,
  });
}
