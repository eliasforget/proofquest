import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

type QuestKind = "testing" | "docker" | "kubernetes" | "hardening";

type GitHubRepository = {
  default_branch: string;
  full_name: string;
  owner: { login: string };
};

type GitTreeResponse = {
  tree: Array<{ path: string; type: string }>;
  truncated: boolean;
};

type PackageJson = {
  scripts?: Record<string, string>;
};

const GITHUB_API = "https://api.github.com";
const RAW_GITHUB = "https://raw.githubusercontent.com";
const API_VERSION = "2026-03-10";

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
  ) return null;
  return { owner, repo, fullName: `${owner}/${repo}` };
}

function isQuestKind(value: unknown): value is QuestKind {
  return ["testing", "docker", "kubernetes", "hardening"].includes(String(value));
}

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": "ProofQuest-Quest-Verifier",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`);
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

async function evaluateQuest(owner: string, repo: string, kind: QuestKind) {
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
      Promise.all(packagePaths.map((path) => rawFile(owner, repo, metadata.default_branch, path))),
      Promise.all(workflowPaths.map((path) => rawFile(owner, repo, metadata.default_branch, path))),
      Promise.all(tsconfigPaths.map((path) => rawFile(owner, repo, metadata.default_branch, path))),
      dockerfilePath ? rawFile(owner, repo, metadata.default_branch, dockerfilePath) : Promise.resolve(null),
      rootReadme ? rawFile(owner, repo, metadata.default_branch, rootReadme) : Promise.resolve(null),
      Promise.all(k8sPaths.map((path) => rawFile(owner, repo, metadata.default_branch, path))),
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
    /\bdocker\s+(?:compose\s+up|run|build)\b|\bdocker-compose\s+up\b/i.test(readme ?? "");

  const hasDeployment = /\bkind\s*:\s*Deployment\b/i.test(k8s);
  const hasService = /\bkind\s*:\s*Service\b/i.test(k8s);
  const hasProbe = /\b(readinessProbe|livenessProbe|startupProbe)\s*:/i.test(k8s);

  let typescriptStrict = false;
  for (const text of tsconfigTexts) {
    if (!text) continue;
    try {
      const parsed = JSON.parse(text) as { compilerOptions?: { strict?: boolean } };
      if (parsed.compilerOptions?.strict === true) {
        typescriptStrict = true;
        break;
      }
    } catch {
      // Ignore invalid JSON; verification stays conservative.
    }
  }
  const ciRunsTypecheck =
    /\b(npm\s+run\s+typecheck|pnpm\s+(?:run\s+)?typecheck|yarn\s+(?:run\s+)?typecheck|tsc\s+--noEmit)\b/i.test(
      workflows,
    );

  const evaluations: Record<QuestKind, Array<{ id: string; completed: boolean }>> = {
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
    objectives,
    complete: objectives.every((objective) => objective.completed),
  };
}

Deno.serve(
  withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    try {
      const body = await req.json();
      const parsed = parseRepository(body?.repositoryFullName);
      const kind = body?.kind;

      if (!parsed || !isQuestKind(kind)) {
        return json({ error: "invalid_request" }, 400);
      }

      const userId =
        String((ctx.jwtClaims as { sub?: string } | undefined)?.sub ?? "") ||
        String((ctx.userClaims as { id?: string } | undefined)?.id ?? "");

      if (!userId) return json({ error: "missing_user" }, 401);

      const { data: profile, error: profileError } = await ctx.supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError || !profile?.username) {
        return json({ error: "profile_not_found" }, 403);
      }

      if (parsed.owner.toLowerCase() !== String(profile.username).toLowerCase()) {
        return json({ error: "repository_not_owned_by_user" }, 403);
      }

      const evaluation = await evaluateQuest(parsed.owner, parsed.repo, kind);

      if (!evaluation.complete) {
        return json({
          verified: false,
          awarded: false,
          repository: evaluation.repository,
          kind,
          objectives: evaluation.objectives,
        });
      }

      const { data: reward, error: rewardError } = await ctx.supabaseAdmin.rpc(
        "award_verified_quest",
        {
          p_user_id: userId,
          p_repository_full_name: evaluation.repository,
          p_kind: kind,
        },
      );

      if (rewardError) throw rewardError;
      const row = Array.isArray(reward) ? reward[0] : reward;

      return json({
        verified: true,
        awarded: Boolean(row?.awarded),
        xpReward: Number(row?.xp_reward ?? 0),
        totalXp: Number(row?.total_xp ?? 0),
        repository: evaluation.repository,
        kind,
        objectives: evaluation.objectives,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "verification_failed";
      return json({ error: message }, 500);
    }
  }),
);
