import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

type QuestKind = "testing" | "docker" | "kubernetes" | "hardening";
type QuestAction = "start" | "verify";

type GitHubRepository = {
  default_branch: string;
  full_name: string;
};

type GitHubUser = {
  id: number;
  login: string;
};

type GitTreeResponse = {
  tree: Array<{ path: string; type: string }>;
  truncated: boolean;
};

type GitHubCommitListItem = {
  sha: string;
  html_url: string;
  author: { id: number; login: string } | null;
  commit: {
    author: { date: string | null } | null;
    committer: { date: string | null } | null;
  };
};

type GitHubCommitDetail = GitHubCommitListItem & {
  files?: Array<{ filename: string }>;
};

type PackageJson = {
  scripts?: Record<string, string>;
};

type Objective = {
  id: string;
  completed: boolean;
};

type QuestEvaluation = {
  repository: string;
  defaultBranch: string;
  objectives: Objective[];
  complete: boolean;
};

const GITHUB_API = "https://api.github.com";
const RAW_GITHUB = "https://raw.githubusercontent.com";
const API_VERSION = "2026-03-10";

const QUEST_REWARD: Record<QuestKind, number> = {
  testing: 850,
  docker: 900,
  kubernetes: 1250,
  hardening: 700,
};

const QUEST_TARGET: Record<QuestKind, string> = {
  testing: "testing",
  docker: "docker",
  kubernetes: "kubernetes",
  hardening: "typescript",
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders, "Cache-Control": "no-store" },
  });
}

function parseRepository(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\.git$/i, "");
  const [owner, repo, ...rest] = normalized.split("/");

  if (
    rest.length ||
    !owner ||
    !repo ||
    !/^[A-Za-z0-9_.-]+$/.test(owner) ||
    !/^[A-Za-z0-9_.-]+$/.test(repo)
  ) {
    return null;
  }

  return { owner, repo, fullName: `${owner}/${repo}` };
}

function isQuestKind(value: unknown): value is QuestKind {
  return ["testing", "docker", "kubernetes", "hardening"].includes(String(value));
}

function isAction(value: unknown): value is QuestAction {
  return value === "start" || value === "verify";
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "ProofQuest-Quest-Verifier",
  };
}

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${path}`);
  }

  return response.json() as Promise<T>;
}

function rawUrl(owner: string, repo: string, ref: string, path: string) {
  const encodePath = (value: string) =>
    value.split("/").map(encodeURIComponent).join("/");

  return `${RAW_GITHUB}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodePath(ref)}/${encodePath(path)}`;
}

async function rawFile(owner: string, repo: string, ref: string, path: string) {
  const response = await fetch(rawUrl(owner, repo, ref, path), {
    headers: { "User-Agent": "ProofQuest-Quest-Verifier" },
  });

  return response.ok ? response.text() : null;
}

function matches(paths: string[], regex: RegExp) {
  return paths.filter((path) => regex.test(path));
}

async function evaluateQuest(
  owner: string,
  repo: string,
  kind: QuestKind,
): Promise<QuestEvaluation> {
  const metadata = await githubJson<GitHubRepository>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  );

  const tree = await githubJson<GitTreeResponse>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`,
  );

  if (tree.truncated) {
    throw new Error("Repository tree is truncated; verification cannot be trusted.");
  }

  const paths = tree.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  const packagePaths = matches(paths, /(^|\/)package\.json$/i)
    .sort((a, b) => a.split("/").length - b.split("/").length)
    .slice(0, 6);
  const workflowPaths = matches(paths, /^\.github\/workflows\/.*\.ya?ml$/i).slice(0, 8);
  const tsconfigPaths = matches(paths, /(^|\/)tsconfig(?:\.[^/]+)?\.json$/i)
    .sort((a, b) => a.split("/").length - b.split("/").length)
    .slice(0, 5);
  const dockerfilePath = matches(paths, /(^|\/)dockerfile(?:\.[^/]+)?$/i)[0];
  const rootReadme = paths.find((path) => /^readme\.(md|mdx|txt)$/i.test(path));
  const architectureDoc = paths.find((path) =>
    /(^|\/)(architecture|arch|technical-design|design-doc)(\.[^/]+)?\.md$/i.test(path),
  );
  const k8sPaths = matches(
    paths,
    /(^|\/)(k8s|kubernetes|helm|charts?)\/|(^|\/)(deployment|statefulset|daemonset|service)\.ya?ml$/i,
  ).slice(0, 12);

  const [packageTexts, workflowTexts, tsconfigTexts, dockerfile, readme, k8sTexts] =
    await Promise.all([
      Promise.all(
        packagePaths.map((path) =>
          rawFile(owner, repo, metadata.default_branch, path),
        ),
      ),
      Promise.all(
        workflowPaths.map((path) =>
          rawFile(owner, repo, metadata.default_branch, path),
        ),
      ),
      Promise.all(
        tsconfigPaths.map((path) =>
          rawFile(owner, repo, metadata.default_branch, path),
        ),
      ),
      dockerfilePath
        ? rawFile(owner, repo, metadata.default_branch, dockerfilePath)
        : Promise.resolve(null),
      rootReadme
        ? rawFile(owner, repo, metadata.default_branch, rootReadme)
        : Promise.resolve(null),
      Promise.all(
        k8sPaths.map((path) =>
          rawFile(owner, repo, metadata.default_branch, path),
        ),
      ),
    ]);

  const packages: PackageJson[] = packageTexts.flatMap((text) => {
    if (!text) return [];

    try {
      return [JSON.parse(text) as PackageJson];
    } catch {
      return [];
    }
  });

  const scripts = packages.flatMap((pkg) => Object.entries(pkg.scripts ?? {}));
  const workflows = workflowTexts.filter(Boolean).join("\n");
  const k8s = k8sTexts.filter(Boolean).join("\n");
  const testFiles = matches(
    paths,
    /(^|\/)(test|tests|__tests__)\/|\.(test|spec)\.[cm]?[jt]sx?$/i,
  );

  const hasTestScript = scripts.some(
    ([name, command]) =>
      /^test(?::|$)/i.test(name) ||
      /\b(vitest|jest|mocha|playwright\s+test|cypress\s+run)\b/i.test(command),
  );
  const ciRunsTests =
    /\b(npm|pnpm|yarn)\s+(?:run\s+)?test\b|\b(vitest|jest|playwright\s+test|cypress\s+run)\b/i.test(
      workflows,
    );

  const dockerStages = dockerfile?.match(/^\s*FROM\s+/gim)?.length ?? 0;
  const dockerMultiStage =
    dockerStages >= 2 || /\bAS\s+[A-Za-z0-9_-]+/i.test(dockerfile ?? "");
  const dockerDocumented =
    /\bdocker\s+(?:compose\s+up|run|build)\b|\bdocker-compose\s+up\b/i.test(
      readme ?? "",
    );

  const hasDeployment = /\bkind\s*:\s*Deployment\b/i.test(k8s);
  const hasService = /\bkind\s*:\s*Service\b/i.test(k8s);
  const hasProbe = /\b(readinessProbe|livenessProbe|startupProbe)\s*:/i.test(k8s);

  let typescriptStrict = false;

  for (const text of tsconfigTexts) {
    if (!text) continue;

    try {
      const parsed = JSON.parse(text) as {
        compilerOptions?: { strict?: boolean };
      };

      if (parsed.compilerOptions?.strict === true) {
        typescriptStrict = true;
        break;
      }
    } catch {
      // Invalid JSON does not count as evidence.
    }
  }

  const ciRunsTypecheck =
    /\b(npm\s+run\s+typecheck|pnpm\s+(?:run\s+)?typecheck|yarn\s+(?:run\s+)?typecheck|tsc\s+--noEmit)\b/i.test(
      workflows,
    );

  const evaluations: Record<QuestKind, Objective[]> = {
    testing: [
      { id: "tests", completed: testFiles.length >= 5 },
      { id: "script", completed: hasTestScript },
      { id: "ci", completed: ciRunsTests },
    ],
    docker: [
      { id: "dockerfile", completed: Boolean(dockerfilePath) },
      { id: "multistage", completed: dockerMultiStage },
      { id: "docs", completed: dockerDocumented },
    ],
    kubernetes: [
      { id: "deployment", completed: hasDeployment },
      { id: "service", completed: hasService },
      { id: "probes", completed: hasProbe },
    ],
    hardening: [
      { id: "strict", completed: typescriptStrict },
      { id: "architecture", completed: Boolean(architectureDoc) },
      { id: "typecheck-ci", completed: ciRunsTypecheck },
    ],
  };

  const objectives = evaluations[kind];

  return {
    repository: metadata.full_name,
    defaultBranch: metadata.default_branch,
    objectives,
    complete: objectives.every((objective) => objective.completed),
  };
}

function isRelevantFile(kind: QuestKind, filename: string) {
  const path = filename.toLowerCase();

  if (kind === "testing") {
    return (
      /(^|\/)(test|tests|__tests__)\//i.test(path) ||
      /\.(test|spec)\.[cm]?[jt]sx?$/i.test(path) ||
      /(^|\/)package\.json$/i.test(path) ||
      /^\.github\/workflows\/.*\.ya?ml$/i.test(path)
    );
  }

  if (kind === "docker") {
    return (
      /(^|\/)dockerfile(?:\.[^/]+)?$/i.test(path) ||
      /(^|\/)\.dockerignore$/i.test(path) ||
      /(^|\/)(docker-)?compose(?:\.[^/]+)?\.ya?ml$/i.test(path) ||
      /^readme\.(md|mdx|txt)$/i.test(path)
    );
  }

  if (kind === "kubernetes") {
    return /(^|\/)(k8s|kubernetes|helm|charts?)\/|(^|\/)(deployment|statefulset|daemonset|service)\.ya?ml$/i.test(
      path,
    );
  }

  return (
    /(^|\/)tsconfig(?:\.[^/]+)?\.json$/i.test(path) ||
    /(^|\/)(architecture|arch|technical-design|design-doc)(\.[^/]+)?\.md$/i.test(path) ||
    /^\.github\/workflows\/.*\.ya?ml$/i.test(path)
  );
}

async function findContributionCommit({
  owner,
  repo,
  defaultBranch,
  githubUserId,
  login,
  since,
  kind,
}: {
  owner: string;
  repo: string;
  defaultBranch: string;
  githubUserId: number;
  login: string;
  since: string;
  kind: QuestKind;
}) {
  const query = new URLSearchParams({
    sha: defaultBranch,
    author: login,
    since,
    per_page: "100",
  });

  const commits = await githubJson<GitHubCommitListItem[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${query.toString()}`,
  );

  for (const commit of commits) {
    if (commit.author?.id !== githubUserId) continue;

    const authoredAt =
      commit.commit.author?.date ?? commit.commit.committer?.date ?? null;

    if (!authoredAt || new Date(authoredAt).getTime() < new Date(since).getTime()) {
      continue;
    }

    const detail = await githubJson<GitHubCommitDetail>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(commit.sha)}`,
    );

    const relevantFiles = (detail.files ?? [])
      .map((file) => file.filename)
      .filter((filename) => isRelevantFile(kind, filename));

    if (relevantFiles.length === 0) continue;

    return {
      sha: commit.sha,
      url: commit.html_url,
      authoredAt,
      relevantFiles: relevantFiles.slice(0, 20),
    };
  }

  return null;
}

Deno.serve(
  withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    try {
      const body = await req.json();
      const action = body?.action;
      const parsed = parseRepository(body?.repositoryFullName);
      const kind = body?.kind;

      if (!parsed || !isQuestKind(kind) || !isAction(action)) {
        return json({ error: "invalid_request", code: "invalid_request" }, 400);
      }

      const userId =
        String((ctx.jwtClaims as { sub?: string } | undefined)?.sub ?? "") ||
        String((ctx.userClaims as { id?: string } | undefined)?.id ?? "");

      if (!userId) {
        return json({ error: "missing_user", code: "missing_user" }, 401);
      }

      const { data: profile, error: profileError } = await ctx.supabase
        .from("profiles")
        .select("username,github_user_id")
        .eq("user_id", userId)
        .maybeSingle();

      const githubUserId = Number(profile?.github_user_id ?? 0);

      if (
        profileError ||
        !profile ||
        !Number.isSafeInteger(githubUserId) ||
        githubUserId <= 0
      ) {
        return json(
          {
            error: "github_identity_not_bound",
            code: "github_identity_not_bound",
          },
          403,
        );
      }

      const identity = await githubJson<GitHubUser>(
        `/user/${encodeURIComponent(String(githubUserId))}`,
      );

      if (identity.id !== githubUserId || !identity.login) {
        return json(
          { error: "github_identity_mismatch", code: "github_identity_mismatch" },
          403,
        );
      }

      if (action === "start") {
        const evaluation = await evaluateQuest(parsed.owner, parsed.repo, kind);

        if (evaluation.complete) {
          return json({
            active: false,
            verified: false,
            code: "quest_already_complete",
            objectives: evaluation.objectives,
          });
        }

        const baseline = evaluation.objectives
          .filter((objective) => objective.completed)
          .map((objective) => objective.id);

        const startedAt = new Date().toISOString();

        const { error: activeError } = await ctx.supabaseAdmin
          .from("active_quests")
          .upsert(
            {
              user_id: userId,
              repository_full_name: evaluation.repository,
              id: `${kind}:${evaluation.repository.toLowerCase()}`,
              kind,
              xp_reward: QUEST_REWARD[kind],
              target_skill_key: QUEST_TARGET[kind],
              started_at: startedAt,
              baseline_completed_objective_ids: baseline,
              objective_count: evaluation.objectives.length,
            },
            { onConflict: "user_id,repository_full_name,kind" },
          );

        if (activeError) throw activeError;

        return json({
          active: true,
          verified: false,
          repository: evaluation.repository,
          kind,
          startedAt,
          baselineCompletedObjectiveIds: baseline,
          objectives: evaluation.objectives,
        });
      }

      const { data: activeQuest, error: activeError } = await ctx.supabaseAdmin
        .from("active_quests")
        .select(
          "repository_full_name,kind,started_at,baseline_completed_objective_ids",
        )
        .eq("user_id", userId)
        .ilike("repository_full_name", parsed.fullName)
        .eq("kind", kind)
        .maybeSingle();

      if (activeError) throw activeError;

      if (!activeQuest) {
        return json({
          active: false,
          verified: false,
          code: "quest_not_active",
        });
      }

      const evaluation = await evaluateQuest(parsed.owner, parsed.repo, kind);

      if (!evaluation.complete) {
        return json({
          active: true,
          verified: false,
          code: "objectives_incomplete",
          repository: evaluation.repository,
          kind,
          objectives: evaluation.objectives,
        });
      }

      const baseline = Array.isArray(activeQuest.baseline_completed_objective_ids)
        ? activeQuest.baseline_completed_objective_ids.map(String)
        : [];

      const newlyCompleted = evaluation.objectives
        .filter(
          (objective) =>
            objective.completed && !baseline.includes(objective.id),
        )
        .map((objective) => objective.id);

      if (newlyCompleted.length === 0) {
        return json({
          active: true,
          verified: false,
          code: "no_new_objective",
          objectives: evaluation.objectives,
        });
      }

      const contribution = await findContributionCommit({
        owner: parsed.owner,
        repo: parsed.repo,
        defaultBranch: evaluation.defaultBranch,
        githubUserId,
        login: identity.login,
        since: activeQuest.started_at,
        kind,
      });

      if (!contribution) {
        return json({
          active: true,
          verified: false,
          code: "contribution_not_found",
          objectives: evaluation.objectives,
          newlyCompletedObjectiveIds: newlyCompleted,
        });
      }

      const verificationMetadata = {
        githubLogin: identity.login,
        commitUrl: contribution.url,
        commitAuthoredAt: contribution.authoredAt,
        relevantFiles: contribution.relevantFiles,
        baselineCompletedObjectiveIds: baseline,
        newlyCompletedObjectiveIds: newlyCompleted,
        currentCompletedObjectiveIds: evaluation.objectives
          .filter((objective) => objective.completed)
          .map((objective) => objective.id),
      };

      const { data: reward, error: rewardError } =
        await ctx.supabaseAdmin.rpc("award_verified_quest_v2", {
          p_user_id: userId,
          p_repository_full_name: evaluation.repository,
          p_kind: kind,
          p_verified_commit_sha: contribution.sha,
          p_verified_github_user_id: githubUserId,
          p_verification_method: "github_commit_after_start",
          p_verification_metadata: verificationMetadata,
        });

      if (rewardError) throw rewardError;

      const row = Array.isArray(reward) ? reward[0] : reward;

      return json({
        active: false,
        verified: true,
        awarded: Boolean(row?.awarded),
        xpReward: Number(row?.xp_reward ?? 0),
        totalXp: Number(row?.total_xp ?? 0),
        repository: evaluation.repository,
        kind,
        commitSha: contribution.sha,
        commitUrl: contribution.url,
        objectives: evaluation.objectives,
        newlyCompletedObjectiveIds: newlyCompleted,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "verification_failed";

      return json(
        {
          error: message,
          code: "verification_failed",
        },
        500,
      );
    }
  }),
);
