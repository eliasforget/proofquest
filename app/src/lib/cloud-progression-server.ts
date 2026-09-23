import type { AccountSnapshot } from "@/lib/auth";
import type { RepositoryAnalysis } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export type CloudQuestState = {
  eligible: boolean;
  active: boolean;
  completed: boolean;
  totalXp: number;
};

function ownsRepository(account: AccountSnapshot, analysis: RepositoryAnalysis) {
  return Boolean(
    account.signedIn &&
    account.userId &&
    account.username &&
    account.username.toLowerCase() === analysis.repository.owner.toLowerCase(),
  );
}

export async function getCloudQuestState(
  account: AccountSnapshot,
  analysis: RepositoryAnalysis,
): Promise<CloudQuestState> {
  if (!ownsRepository(account, analysis) || !account.userId) {
    return { eligible: false, active: false, completed: false, totalXp: 0 };
  }

  const supabase = await createClient();
  const [activeResult, historyResult, progressResult] = await Promise.all([
    supabase
      .from("active_quests")
      .select("id")
      .eq("user_id", account.userId)
      .eq("repository_full_name", analysis.repository.fullName)
      .eq("kind", analysis.quest.kind)
      .maybeSingle(),
    supabase
      .from("quest_history")
      .select("id")
      .eq("user_id", account.userId)
      .eq("repository_full_name", analysis.repository.fullName)
      .eq("kind", analysis.quest.kind)
      .maybeSingle(),
    supabase
      .from("player_progress")
      .select("total_xp")
      .eq("user_id", account.userId)
      .maybeSingle(),
  ]);

  return {
    eligible: true,
    active: Boolean(activeResult.data),
    completed: Boolean(historyResult.data),
    totalXp: Number(progressResult.data?.total_xp ?? 0),
  };
}

export async function saveCloudScan(
  account: AccountSnapshot,
  analysis: RepositoryAnalysis,
) {
  if (!ownsRepository(account, analysis) || !account.userId) return;

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
