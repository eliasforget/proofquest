import type { Evidence, RepositoryAnalysis, SkillNode } from "@/lib/domain";
import { buildQuestDeck, chooseQuest, completedQuestList, type DeepFacts } from "@/lib/github/quest-engine";
import {
  GitHubAnalysisError,
  githubJson,
  githubRawFile,
  type GitHubRepository,
  type GitTreeResponse,
} from "@/lib/github/client";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

type LoadedPackage = {
  path: string;
  data: PackageJson;
};


export type GitHubAnalysisOptions = {
  fresh?: boolean;
};

export { GitHubAnalysisError };

function dependencySet(packages: LoadedPackage[]) {
  return new Set(
    packages.flatMap(({ data }) => [
      ...Object.keys(data.dependencies ?? {}),
      ...Object.keys(data.devDependencies ?? {}),
      ...Object.keys(data.peerDependencies ?? {}),
    ]),
  );
}

function mergedScripts(packages: LoadedPackage[]) {
  return packages.flatMap(({ path, data }) =>
    Object.entries(data.scripts ?? {}).map(([name, command]) => ({ path, name, command })),
  );
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function levelFromProgress(progress: number) {
  if (progress <= 0) return 0;
  return Math.max(1, Math.min(10, Math.ceil(progress / 10)));
}

function evidenceId(skillKey: string, index: number) {
  return `${skillKey}-${String(index + 1).padStart(2, "0")}`;
}

function addEvidence(
  target: Evidence[],
  skillKey: string,
  type: string,
  messageKey: string,
  label: string,
  sourcePath?: string,
  messageParams?: Record<string, string | number>,
  confidence = 1,
) {
  const item: Evidence = {
    id: evidenceId(skillKey, target.filter((entry) => entry.skillKey === skillKey).length),
    skillKey,
    type,
    label,
    messageKey,
    messageParams,
    sourcePath,
    confidence,
  };
  target.push(item);
  return item.id;
}

function hasPath(paths: Set<string>, ...candidates: string[]) {
  return candidates.some((candidate) => paths.has(candidate.toLowerCase()));
}

function pathMatches(paths: string[], matcher: RegExp) {
  return paths.filter((path) => matcher.test(path));
}

function firstMatching<T extends { path: string; content: string | null }>(items: T[], matcher: RegExp) {
  return items.find((item) => item.content && matcher.test(item.content));
}

function skill(
  id: string,
  name: string,
  progress: number,
  x: number,
  y: number,
  evidence: Evidence[],
  state: "core" | "active" | "locked" = "active",
): SkillNode {
  const normalized = clamp(progress);
  return {
    id,
    name,
    progress: normalized,
    level: levelFromProgress(normalized),
    x,
    y,
    state: normalized === 0 ? "locked" : state === "locked" ? "active" : state,
    evidenceIds: evidence.filter((item) => item.skillKey === id).map((item) => item.id),
  };
}

export async function analyzePublicRepository(
  owner: string,
  repo: string,
  options: GitHubAnalysisOptions = {},
): Promise<RepositoryAnalysis> {
  const safeOwner = owner.trim();
  const safeRepo = repo.trim().replace(/\.git$/i, "");
  const fresh = options.fresh === true;

  if (!/^[A-Za-z0-9_.-]+$/.test(safeOwner) || !/^[A-Za-z0-9_.-]+$/.test(safeRepo)) {
    throw new GitHubAnalysisError("Invalid GitHub owner or repository name.", 400);
  }

  const repository = await githubJson<GitHubRepository>(
    `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepo)}`,
    fresh,
  );

  const [languagesObject, treeResponse] = await Promise.all([
    githubJson<Record<string, number>>(
      `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepo)}/languages`,
      fresh,
    ),
    githubJson<GitTreeResponse>(
      `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepo)}/git/trees/${encodeURIComponent(
        repository.default_branch,
      )}?recursive=1`,
      fresh,
    ),
  ]);

  const files = treeResponse.tree.filter((entry) => entry.type === "blob");
  const filePaths = files.map((entry) => entry.path);
  const normalizedPaths = new Set(filePaths.map((path) => path.toLowerCase()));

  const packageJsonPaths = filePaths
    .filter((path) => /(^|\/)package\.json$/i.test(path))
    .sort((a, b) => a.split("/").length - b.split("/").length)
    .slice(0, 6);

  const packageContents = await Promise.all(
    packageJsonPaths.map(async (path) => ({
      path,
      content: await githubRawFile(safeOwner, safeRepo, path, repository.default_branch, fresh),
    })),
  );

  const packages: LoadedPackage[] = packageContents.flatMap(({ path, content }) => {
    if (!content) return [];
    try {
      return [{ path, data: JSON.parse(content) as PackageJson }];
    } catch {
      return [];
    }
  });

  const dependencies = dependencySet(packages);
  const scripts = mergedScripts(packages);
  const evidence: Evidence[] = [];

  const tsFiles = pathMatches(filePaths, /\.(ts|tsx|mts|cts)$/i);
  const jsFiles = pathMatches(filePaths, /\.(js|jsx|mjs|cjs)$/i);
  const tsxFiles = pathMatches(filePaths, /\.tsx$/i);
  const testFiles = pathMatches(filePaths, /(^|\/)(test|tests|__tests__)\/|\.(test|spec)\.[cm]?[jt]sx?$/i);
  const workflowFiles = pathMatches(filePaths, /^\.github\/workflows\/.*\.ya?ml$/i).slice(0, 8);
  const dockerfilePaths = pathMatches(filePaths, /(^|\/)dockerfile(?:\.[^/]+)?$/i).slice(0, 4);
  const composeFiles = pathMatches(filePaths, /(^|\/)(compose\.ya?ml|docker-compose\.ya?ml)$/i);
  const k8sFiles = pathMatches(filePaths, /(^|\/)(k8s|kubernetes|helm|charts?)\/|(^|\/)(deployment|statefulset|daemonset|service)\.ya?ml$/i).slice(0, 10);
  const tsConfigPaths = pathMatches(filePaths, /(^|\/)tsconfig(?:\.[^/]+)?\.json$/i)
    .sort((a, b) => a.split("/").length - b.split("/").length)
    .slice(0, 5);
  const rootReadme = filePaths.find((path) => /^readme\.(md|mdx|txt)$/i.test(path));
  const architectureDoc = filePaths.find((path) => /(^|\/)(architecture|arch|technical-design|design-doc)(\.[^/]+)?\.md$/i.test(path))
    ?? filePaths.find((path) => /(^|\/)architecture\//i.test(path));
  const docsFiles = pathMatches(filePaths, /(^|\/)(docs?|documentation)\/.*\.(md|mdx|txt)$/i);
  const securityPolicy = filePaths.find((path) => /(^|\/)(\.github\/)?security\.md$/i.test(path));
  const dependencyBot = filePaths.find((path) =>
    /(^|\/)\.github\/dependabot\.ya?ml$/i.test(path)
    || /(^|\/)renovate(?:\.json|\.json5|\.ya?ml)$/i.test(path),
  );

  const [tsConfigs, workflows, dockerfiles, manifests, readmeContent] = await Promise.all([
    Promise.all(tsConfigPaths.map(async (path) => ({ path, content: await githubRawFile(safeOwner, safeRepo, path, repository.default_branch, fresh) }))),
    Promise.all(workflowFiles.map(async (path) => ({ path, content: await githubRawFile(safeOwner, safeRepo, path, repository.default_branch, fresh) }))),
    Promise.all(dockerfilePaths.map(async (path) => ({ path, content: await githubRawFile(safeOwner, safeRepo, path, repository.default_branch, fresh) }))),
    Promise.all(k8sFiles.map(async (path) => ({ path, content: await githubRawFile(safeOwner, safeRepo, path, repository.default_branch, fresh) }))),
    rootReadme ? githubRawFile(safeOwner, safeRepo, rootReadme, repository.default_branch, fresh) : Promise.resolve(null),
  ]);

  const totalSourceFiles = Math.max(1, tsFiles.length + jsFiles.length);
  const tsRatio = tsFiles.length / totalSourceFiles;

  const mainTsConfig = tsConfigs.find((item) => /(^|\/)tsconfig\.json$/i.test(item.path)) ?? tsConfigs[0];
  const typescriptStrict = Boolean(mainTsConfig?.content && /["']strict["']\s*:\s*true\b/i.test(mainTsConfig.content));
  const noImplicitAny = Boolean(mainTsConfig?.content && /["']noImplicitAny["']\s*:\s*true\b/i.test(mainTsConfig.content));
  const strictNullChecks = Boolean(mainTsConfig?.content && /["']strictNullChecks["']\s*:\s*true\b/i.test(mainTsConfig.content));
  const noUncheckedIndexedAccess = Boolean(mainTsConfig?.content && /["']noUncheckedIndexedAccess["']\s*:\s*true\b/i.test(mainTsConfig.content));
  const exactOptionalPropertyTypes = Boolean(mainTsConfig?.content && /["']exactOptionalPropertyTypes["']\s*:\s*true\b/i.test(mainTsConfig.content));

  const testScript = scripts.find(({ name, command }) =>
    /(^|:)(test|tests)(:|$)/i.test(name) && !/echo\s+["']?no tests?/i.test(command),
  );
  const typecheckScript = scripts.find(({ name, command }) =>
    /^(typecheck|type-check|check-types|types)$/i.test(name) || /\btsc\b[^\n]*--noEmit\b/i.test(command),
  );
  const ciTestMatch = firstMatching(
    workflows,
    /(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|test:[\w:-]+)\b|\b(?:vitest|jest)\b|\bplaywright\s+test\b|\bcypress\s+run\b/i,
  );
  const ciTypecheckMatch = firstMatching(
    workflows,
    /(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:typecheck|type-check|check-types|types)\b|\btsc\b[^\n]*--noEmit\b/i,
  );
  const ciBuildMatch = firstMatching(
    workflows,
    /(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?build\b|\bnext\s+build\b|\bvite\s+build\b|\bgradle(?:w)?\s+build\b|\bmvn\s+(?:package|verify)\b/i,
  );
  const ciDockerBuild = firstMatching(workflows, /\bdocker\s+(?:build|buildx\s+build)\b/i);
  const codeScanningMatch = firstMatching(
    workflows,
    /github\/codeql-action|dependency-review-action|\bsemgrep\b|\btrivy\b|\bsnyk\b/i,
  );

  const dockerfile = dockerfiles[0];
  const dockerContent = dockerfile?.content ?? "";
  const dockerFromCount = (dockerContent.match(/^\s*FROM\s+/gim) ?? []).length;
  const dockerMultiStage = dockerFromCount >= 2 || /^\s*FROM\s+.+\s+AS\s+\S+/im.test(dockerContent) || /COPY\s+--from=/i.test(dockerContent);
  const dockerNonRoot = /^\s*USER\s+(?!root\b|0\b)\S+/im.test(dockerContent);
  const dockerHealthcheck = /^\s*HEALTHCHECK\b/im.test(dockerContent);
  const hasDockerignore = hasPath(normalizedPaths, ".dockerignore");
  const dockerDocumented = Boolean(readmeContent && /\b(?:docker\s+run|docker\s+compose\s+up|docker-compose\s+up)\b/i.test(readmeContent));

  const deploymentManifest = firstMatching(manifests, /^\s*kind\s*:\s*Deployment\s*$/im);
  const serviceManifest = firstMatching(manifests, /^\s*kind\s*:\s*Service\s*$/im);
  const probeManifest = firstMatching(manifests, /^\s*(?:readinessProbe|livenessProbe|startupProbe)\s*:/im);
  const resourcesManifest = firstMatching(manifests, /^\s*resources\s*:\s*$/im);

  const tsConfigSource = mainTsConfig?.path ?? tsConfigPaths[0];
  if (tsConfigSource) {
    addEvidence(evidence, "typescript", "config", "typescript.config", "TypeScript configuration detected", tsConfigSource);
  }
  if (tsFiles.length > 0) {
    addEvidence(evidence, "typescript", "files", "typescript.files", `${tsFiles.length} TypeScript source files detected`, undefined, { count: tsFiles.length });
  }
  const typescriptPackage = packages.find(({ data }) => Object.prototype.hasOwnProperty.call(data.dependencies ?? {}, "typescript") || Object.prototype.hasOwnProperty.call(data.devDependencies ?? {}, "typescript") || Object.prototype.hasOwnProperty.call(data.peerDependencies ?? {}, "typescript"));
  if (dependencies.has("typescript")) {
    addEvidence(evidence, "typescript", "dependency", "typescript.dependency", "TypeScript is declared as a project dependency", typescriptPackage?.path ?? "package.json");
  }
  if (typescriptStrict) {
    addEvidence(evidence, "typescript", "strict", "typescript.strict", "TypeScript strict mode is enabled", mainTsConfig?.path);
  }
  if (noImplicitAny) {
    addEvidence(evidence, "typescript", "no-implicit-any", "typescript.noImplicitAny", "noImplicitAny is enabled", mainTsConfig?.path);
  }
  if (strictNullChecks) {
    addEvidence(evidence, "typescript", "strict-null", "typescript.strictNullChecks", "strictNullChecks is enabled", mainTsConfig?.path);
  }
  if (noUncheckedIndexedAccess) {
    addEvidence(evidence, "typescript", "indexed-access", "typescript.noUncheckedIndexedAccess", "noUncheckedIndexedAccess is enabled", mainTsConfig?.path);
  }
  if (exactOptionalPropertyTypes) {
    addEvidence(evidence, "typescript", "optional-types", "typescript.exactOptionalPropertyTypes", "exactOptionalPropertyTypes is enabled", mainTsConfig?.path);
  }
  if (typecheckScript) {
    addEvidence(evidence, "typescript", "typecheck-script", "typescript.typecheckScript", "A repeatable type-check script is declared", typecheckScript.path, { script: typecheckScript.name });
  }
  if (ciTypecheckMatch) {
    addEvidence(evidence, "typescript", "ci-typecheck", "typescript.ciTypecheck", "Type checking is executed in GitHub Actions", ciTypecheckMatch.path);
  }
  const reactPackage = packages.find(({ data }) => Object.prototype.hasOwnProperty.call(data.dependencies ?? {}, "react") || Object.prototype.hasOwnProperty.call(data.devDependencies ?? {}, "react"));
  if (dependencies.has("react")) {
    addEvidence(evidence, "react", "dependency", "react.dependency", "React dependency detected", reactPackage?.path ?? "package.json");
  }
  if (tsxFiles.length > 0) {
    addEvidence(evidence, "react", "files", "react.tsx", `${tsxFiles.length} TSX component files detected`, undefined, { count: tsxFiles.length });
  }

  const nextPackage = packages.find(({ data }) => Object.prototype.hasOwnProperty.call(data.dependencies ?? {}, "next") || Object.prototype.hasOwnProperty.call(data.devDependencies ?? {}, "next"));
  if (dependencies.has("next")) {
    addEvidence(evidence, "next", "dependency", "next.dependency", "Next.js dependency detected", nextPackage?.path ?? "package.json");
  }
  const nextConfig = filePaths.find((path) => /(^|\/)next\.config\.(js|mjs|cjs|ts)$/i.test(path));
  if (nextConfig) {
    addEvidence(evidence, "next", "config", "next.config", "Next.js configuration detected", nextConfig);
  }
  if (pathMatches(filePaths, /(^|\/)(app|pages)\/(page|layout|_app|_document)\.[cm]?[jt]sx?$/i).length > 0) {
    addEvidence(evidence, "next", "structure", "next.structure", "Next.js route structure detected");
  }

  const postgresDeps = ["pg", "postgres", "postgresql", "@neondatabase/serverless", "@vercel/postgres"];
  const detectedPostgresDependency = postgresDeps.find((name) => dependencies.has(name));
  if (detectedPostgresDependency) {
    const packagePath = packages.find(({ data }) =>
      Object.prototype.hasOwnProperty.call(data.dependencies ?? {}, detectedPostgresDependency)
      || Object.prototype.hasOwnProperty.call(data.devDependencies ?? {}, detectedPostgresDependency),
    )?.path;
    addEvidence(
      evidence,
      "postgres",
      "dependency",
      "postgres.dependency",
      `PostgreSQL client dependency detected (${detectedPostgresDependency})`,
      packagePath ?? "package.json",
      { dependency: detectedPostgresDependency },
    );
  }

  const prismaSchema = filePaths.find((path) => /(^|\/)prisma\/schema\.prisma$/i.test(path));
  if (prismaSchema) {
    const prismaContent = await githubRawFile(safeOwner, safeRepo, prismaSchema, repository.default_branch, fresh);
    if (prismaContent && /provider\s*=\s*["']postgresql["']/i.test(prismaContent)) {
      addEvidence(evidence, "postgres", "config", "postgres.prisma", "Prisma datasource uses PostgreSQL", prismaSchema);
    }
  }

  if (testFiles.length > 0) {
    addEvidence(evidence, "testing", "files", "testing.files", `${testFiles.length} test/spec files detected`, undefined, { count: testFiles.length });
  }
  const testRunner = ["vitest", "jest", "@playwright/test", "cypress"].find((name) => dependencies.has(name));
  if (testRunner) {
    const runnerPackage = packages.find(({ data }) =>
      Object.prototype.hasOwnProperty.call(data.dependencies ?? {}, testRunner)
      || Object.prototype.hasOwnProperty.call(data.devDependencies ?? {}, testRunner),
    );
    addEvidence(evidence, "testing", "dependency", "testing.tool", `${testRunner} test tooling detected`, runnerPackage?.path ?? "package.json", { tool: testRunner });
  }
  if (testScript) {
    addEvidence(evidence, "testing", "script", "testing.script", "A repeatable test script is declared", testScript.path, { script: testScript.name });
  }
  if (workflowFiles.length > 0) {
    addEvidence(evidence, "testing", "ci-present", "testing.ci", `${workflowFiles.length} GitHub Actions workflow file(s) detected`, workflowFiles[0], { count: workflowFiles.length });
  }
  if (ciTestMatch) {
    addEvidence(evidence, "testing", "ci-exec", "testing.ciExec", "The test suite is executed in GitHub Actions", ciTestMatch.path);
  }

  if (dockerfile) {
    addEvidence(evidence, "docker", "dockerfile", "docker.dockerfile", "Dockerfile detected", dockerfile.path);
  }
  if (composeFiles.length > 0) {
    addEvidence(evidence, "docker", "compose", "docker.compose", "Docker Compose configuration detected", composeFiles[0], { count: composeFiles.length });
  }
  if (dockerMultiStage && dockerfile) {
    addEvidence(evidence, "docker", "multistage", "docker.multistage", "Multi-stage Docker build detected", dockerfile.path);
  }
  if (dockerNonRoot && dockerfile) {
    addEvidence(evidence, "docker", "non-root", "docker.nonRoot", "Container switches to a non-root user", dockerfile.path);
  }
  if (dockerHealthcheck && dockerfile) {
    addEvidence(evidence, "docker", "healthcheck", "docker.healthcheck", "Docker HEALTHCHECK detected", dockerfile.path);
  }
  if (hasDockerignore) {
    addEvidence(evidence, "docker", "dockerignore", "docker.dockerignore", ".dockerignore detected", ".dockerignore");
  }
  if (dockerDocumented && rootReadme) {
    addEvidence(evidence, "docker", "docs", "docker.docs", "Container run command documented in the README", rootReadme);
  }
  if (ciDockerBuild) {
    addEvidence(evidence, "docker", "ci-build", "docker.ciBuild", "Docker image build detected in GitHub Actions", ciDockerBuild.path);
  }


  if (workflowFiles.length > 0) {
    addEvidence(evidence, "cicd", "workflow", "cicd.workflow", `${workflowFiles.length} GitHub Actions workflow(s) detected`, workflowFiles[0], { count: workflowFiles.length });
  }
  if (ciBuildMatch) {
    addEvidence(evidence, "cicd", "build", "cicd.build", "A production build is executed in CI", ciBuildMatch.path);
  }
  if (ciTestMatch || ciTypecheckMatch) {
    addEvidence(evidence, "cicd", "quality-gate", "cicd.qualityGate", "A test or type-check quality gate runs in CI", (ciTestMatch ?? ciTypecheckMatch)?.path);
  }

  if (rootReadme) {
    addEvidence(evidence, "documentation", "readme", "documentation.readme", "Root README detected", rootReadme);
  }
  if (architectureDoc) {
    addEvidence(evidence, "documentation", "architecture", "documentation.architecture", "Architecture documentation detected", architectureDoc);
  }
  if (docsFiles.length > 0) {
    addEvidence(evidence, "documentation", "docs", "documentation.docs", `${docsFiles.length} documentation file(s) detected`, docsFiles[0], { count: docsFiles.length });
  }

  if (securityPolicy) {
    addEvidence(evidence, "security", "policy", "security.policy", "SECURITY policy detected", securityPolicy);
  }
  if (dependencyBot) {
    addEvidence(evidence, "security", "dependency-bot", "security.dependencyBot", "Automated dependency maintenance detected", dependencyBot);
  }
  if (codeScanningMatch) {
    addEvidence(evidence, "security", "code-scanning", "security.codeScanning", "Automated security scanning detected in CI", codeScanningMatch.path);
  }
  if (k8sFiles.length > 0) {
    addEvidence(evidence, "kubernetes", "files", "kubernetes.files", `${k8sFiles.length} Kubernetes/Helm manifest file(s) detected`, k8sFiles[0], { count: k8sFiles.length });
  }
  if (deploymentManifest) {
    addEvidence(evidence, "kubernetes", "deployment", "kubernetes.deployment", "Kubernetes Deployment detected", deploymentManifest.path);
  }
  if (serviceManifest) {
    addEvidence(evidence, "kubernetes", "service", "kubernetes.service", "Kubernetes Service detected", serviceManifest.path);
  }
  if (probeManifest) {
    addEvidence(evidence, "kubernetes", "probe", "kubernetes.probe", "Kubernetes health probe detected", probeManifest.path);
  }
  if (resourcesManifest) {
    addEvidence(evidence, "kubernetes", "resources", "kubernetes.resources", "Kubernetes resource configuration detected", resourcesManifest.path);
  }

  const typescriptProgress = clamp(
    (tsConfigSource ? 18 : 0)
      + (dependencies.has("typescript") ? 10 : 0)
      + Math.min(22, tsFiles.length * 0.8)
      + tsRatio * 15
      + (typescriptStrict ? 15 : 0)
      + (noImplicitAny ? 5 : 0)
      + (strictNullChecks ? 5 : 0)
      + (noUncheckedIndexedAccess ? 4 : 0)
      + (exactOptionalPropertyTypes ? 4 : 0)
      + (typecheckScript ? 4 : 0)
      + (ciTypecheckMatch ? 8 : 0),
  );
  const reactProgress = clamp(
    (dependencies.has("react") ? 42 : 0) + Math.min(38, tsxFiles.length * 1.5) + (dependencies.has("react-dom") ? 20 : 0),
  );
  const nextProgress = clamp(
    (dependencies.has("next") ? 50 : 0) + (nextConfig ? 20 : 0) + (evidence.some((item) => item.skillKey === "next" && item.type === "structure") ? 30 : 0),
  );
  const postgresProgress = clamp(evidence.filter((item) => item.skillKey === "postgres").length * 40);
  const testingProgress = clamp(
    Math.min(35, testFiles.length * 3.5)
      + (testRunner ? 15 : 0)
      + (testScript ? 15 : 0)
      + (workflowFiles.length > 0 ? 5 : 0)
      + (ciTestMatch ? 25 : 0)
      + (["@playwright/test", "cypress"].includes(testRunner ?? "") ? 10 : 0),
  );
  const dockerProgress = clamp(
    (dockerfile ? 30 : 0)
      + (composeFiles.length > 0 ? 10 : 0)
      + (dockerMultiStage ? 20 : 0)
      + (dockerNonRoot ? 12 : 0)
      + (dockerHealthcheck ? 10 : 0)
      + (hasDockerignore ? 8 : 0)
      + (dockerDocumented ? 5 : 0)
      + (ciDockerBuild ? 10 : 0),
  );
  const kubernetesProgress = clamp(
    (k8sFiles.length > 0 ? 20 : 0)
      + (deploymentManifest ? 25 : 0)
      + (serviceManifest ? 20 : 0)
      + (probeManifest ? 20 : 0)
      + (resourcesManifest ? 15 : 0),
  );
  const cicdProgress = clamp(
    (workflowFiles.length > 0 ? 35 : 0)
      + (ciBuildMatch ? 30 : 0)
      + (ciTestMatch || ciTypecheckMatch ? 35 : 0),
  );
  const documentationProgress = clamp(
    (rootReadme ? 35 : 0)
      + (architectureDoc ? 35 : 0)
      + Math.min(30, docsFiles.length * 10),
  );
  const securityProgress = clamp(
    (securityPolicy ? 30 : 0)
      + (dependencyBot ? 30 : 0)
      + (codeScanningMatch ? 40 : 0),
  );

  const skills = [
    skill("typescript", "TypeScript", typescriptProgress, 50, 12, evidence, "core"),
    skill("next", "Next.js", nextProgress, 29, 40, evidence),
    skill("react", "React", reactProgress, 71, 40, evidence),
    skill("postgres", "PostgreSQL", postgresProgress, 18, 72, evidence),
    skill("testing", "Testing", testingProgress, 50, 75, evidence),
    skill("cicd", "CI/CD", cicdProgress, 68, 72, evidence),
    skill("docker", "Docker", dockerProgress, 82, 72, evidence),
    skill("documentation", "Documentation", documentationProgress, 30, 92, evidence),
    skill("security", "Security", securityProgress, 66, 93, evidence),
    skill("kubernetes", "Kubernetes", kubernetesProgress, 92, 92, evidence, "locked"),
  ];

  const deepFacts: DeepFacts = {
    testFileCount: testFiles.length,
    hasTestScript: Boolean(testScript),
    ciRunsTests: Boolean(ciTestMatch),
    hasDockerfile: Boolean(dockerfile),
    dockerMultiStage,
    dockerDocumented,
    hasDeployment: Boolean(deploymentManifest),
    hasService: Boolean(serviceManifest),
    hasProbe: Boolean(probeManifest),
    typescriptStrict,
    hasArchitectureDoc: Boolean(architectureDoc),
    ciRunsTypecheck: Boolean(ciTypecheckMatch),
    hasWorkflow: workflowFiles.length > 0,
    ciRunsBuild: Boolean(ciBuildMatch),
    hasReadme: Boolean(rootReadme),
    docsFileCount: docsFiles.length,
    hasSecurityPolicy: Boolean(securityPolicy),
    hasDependencyBot: Boolean(dependencyBot),
    hasCodeScanning: Boolean(codeScanningMatch),
  };

  const detectedSkills = skills.filter((entry) => entry.progress > 0);
  const averageProgress = detectedSkills.length
    ? detectedSkills.reduce((sum, entry) => sum + entry.progress, 0) / detectedSkills.length
    : 0;
  const qualitySignals = [Boolean(ciTestMatch), typescriptStrict, Boolean(dockerfile), Boolean(ciTypecheckMatch)].filter(Boolean).length;

  const metrics: Array<readonly [string, number]> = [
    ["Type safety", typescriptProgress],
    ["UI framework", Math.max(reactProgress, nextProgress)],
    ["Database", postgresProgress],
    ["Delivery", Math.max(cicdProgress, clamp((workflowFiles.length > 0 ? 30 : 0) + dockerProgress * 0.7))],
    ["Testing", testingProgress],
    ["Security", securityProgress],
  ];

  const level = Math.max(1, Math.min(50, Math.round(averageProgress / 3 + evidence.length * 0.7 + qualitySignals * 2)));
  const currentXp = Math.round(level * 260 + evidence.length * 90 + qualitySignals * 140);
  const nextLevelXp = (level + 1) * 300 + 1200;

  const totalLanguageBytes = Object.values(languagesObject).reduce((sum, value) => sum + value, 0) || 1;
  const languages = Object.entries(languagesObject)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, bytes]) => ({ name, bytes, percent: Math.round((bytes / totalLanguageBytes) * 1000) / 10 }));

  return {
    repository: {
      owner: repository.owner.login,
      name: repository.name,
      fullName: repository.full_name,
      description: repository.description,
      url: repository.html_url,
      defaultBranch: repository.default_branch,
      primaryLanguage: repository.language,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      fileCount: files.length,
      treeTruncated: treeResponse.truncated,
    },
    languages,
    skills,
    metrics,
    evidence,
    quest: chooseQuest(deepFacts, evidence, skills),
    quests: buildQuestDeck(deepFacts, evidence, skills),
    completedQuests: completedQuestList(deepFacts),
    progression: {
      level,
      currentXp,
      nextLevelXp,
    },
    analyzedAt: new Date().toISOString(),
  };
}
