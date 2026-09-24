import type { Evidence, QuestDraft, SkillNode } from "@/lib/domain";

export type DeepFacts = {
  testFileCount: number;
  hasTestScript: boolean;
  ciRunsTests: boolean;
  hasDockerfile: boolean;
  dockerMultiStage: boolean;
  dockerDocumented: boolean;
  hasDeployment: boolean;
  hasService: boolean;
  hasProbe: boolean;
  typescriptStrict: boolean;
  hasArchitectureDoc: boolean;
  ciRunsTypecheck: boolean;
  hasWorkflow: boolean;
  ciRunsBuild: boolean;
  hasReadme: boolean;
  docsFileCount: number;
  hasSecurityPolicy: boolean;
  hasDependencyBot: boolean;
  hasCodeScanning: boolean;
};

function completedObjective(
  id: string,
  completed: boolean,
  evidenceIds: string[],
) {
  return {
    id,
    completed,
    evidenceIds: completed ? evidenceIds.filter(Boolean) : [],
  };
}

export function completedQuestList(
  facts: DeepFacts,
): Array<{ kind: QuestDraft["kind"]; xpReward: number }> {
  const completed: Array<{
    kind: QuestDraft["kind"];
    xpReward: number;
  }> = [];

  if (facts.testFileCount >= 5 && facts.hasTestScript && facts.ciRunsTests) {
    completed.push({ kind: "testing", xpReward: 850 });
  }

  if (
    facts.hasDockerfile &&
    facts.dockerMultiStage &&
    facts.dockerDocumented
  ) {
    completed.push({ kind: "docker", xpReward: 900 });
  }

  if (facts.hasDeployment && facts.hasService && facts.hasProbe) {
    completed.push({ kind: "kubernetes", xpReward: 1250 });
  }

  if (facts.hasWorkflow && facts.ciRunsBuild && (facts.ciRunsTests || facts.ciRunsTypecheck)) {
    completed.push({ kind: "cicd", xpReward: 950 });
  }

  if (facts.hasReadme && facts.hasArchitectureDoc && facts.docsFileCount >= 2) {
    completed.push({ kind: "documentation", xpReward: 600 });
  }

  if (facts.hasSecurityPolicy && facts.hasDependencyBot && facts.hasCodeScanning) {
    completed.push({ kind: "security", xpReward: 1100 });
  }

  if (
    facts.typescriptStrict &&
    facts.hasArchitectureDoc &&
    facts.ciRunsTypecheck
  ) {
    completed.push({ kind: "hardening", xpReward: 700 });
  }

  return completed;
}

export function buildQuestDeck(
  facts: DeepFacts,
  evidence: Evidence[],
  skills: SkillNode[],
): QuestDraft[] {
  const ids = (skillKey: string, ...types: string[]) =>
    evidence
      .filter(
        (item) =>
          item.skillKey === skillKey && types.includes(item.type),
      )
      .map((item) => item.id);

  const testing: QuestDraft = {
    kind: "testing",
    title: "Testing Initiate",
    description:
      "Build a meaningful automated test layer and make it part of the repository workflow.",
    targetSkillKey: "testing",
    criteria: [
      "Add at least 5 meaningful automated tests",
      "Add a repeatable test command",
      "Run the test suite in CI",
    ],
    objectives: [
      completedObjective(
        "tests",
        facts.testFileCount >= 5,
        ids("testing", "files"),
      ),
      completedObjective(
        "script",
        facts.hasTestScript,
        ids("testing", "script"),
      ),
      completedObjective(
        "ci",
        facts.ciRunsTests,
        ids("testing", "ci-exec"),
      ),
    ],
    xpReward: 850,
  };

  const docker: QuestDraft = {
    kind: "docker",
    title: "Container Forge",
    description:
      "Make the project reproducible in a containerized local environment.",
    targetSkillKey: "docker",
    criteria: [
      "Add a Dockerfile",
      "Use a multi-stage build",
      "Document the run command",
    ],
    objectives: [
      completedObjective(
        "dockerfile",
        facts.hasDockerfile,
        ids("docker", "dockerfile"),
      ),
      completedObjective(
        "multistage",
        facts.dockerMultiStage,
        ids("docker", "multistage"),
      ),
      completedObjective(
        "docs",
        facts.dockerDocumented,
        ids("docker", "docs"),
      ),
    ],
    xpReward: 900,
  };

  const kubernetes: QuestDraft = {
    kind: "kubernetes",
    title: "Orchestration Gate",
    description:
      "Turn the containerized app into a minimal deployable Kubernetes workload.",
    targetSkillKey: "kubernetes",
    criteria: [
      "Add a Deployment manifest",
      "Add a Service manifest",
      "Define readiness or liveness probes",
    ],
    objectives: [
      completedObjective(
        "deployment",
        facts.hasDeployment,
        ids("kubernetes", "deployment"),
      ),
      completedObjective(
        "service",
        facts.hasService,
        ids("kubernetes", "service"),
      ),
      completedObjective(
        "probes",
        facts.hasProbe,
        ids("kubernetes", "probe"),
      ),
    ],
    xpReward: 1250,
  };

  const cicd: QuestDraft = {
    kind: "cicd",
    title: "Delivery Circuit",
    description:
      "Turn repository automation into a repeatable delivery pipeline with real quality gates.",
    targetSkillKey: "cicd",
    criteria: [
      "Add a GitHub Actions workflow",
      "Run a build in CI",
      "Run tests or type checking in CI",
    ],
    objectives: [
      completedObjective("workflow", facts.hasWorkflow, ids("cicd", "workflow")),
      completedObjective("build", facts.ciRunsBuild, ids("cicd", "build")),
      completedObjective(
        "quality-gate",
        facts.ciRunsTests || facts.ciRunsTypecheck,
        ids("cicd", "quality-gate"),
      ),
    ],
    xpReward: 950,
  };

  const documentation: QuestDraft = {
    kind: "documentation",
    title: "Knowledge Beacon",
    description:
      "Make the repository understandable without relying on tribal knowledge.",
    targetSkillKey: "documentation",
    criteria: [
      "Keep a root README",
      "Document the architecture",
      "Add at least 2 documentation files",
    ],
    objectives: [
      completedObjective("readme", facts.hasReadme, ids("documentation", "readme")),
      completedObjective(
        "architecture",
        facts.hasArchitectureDoc,
        ids("documentation", "architecture"),
      ),
      completedObjective(
        "docs",
        facts.docsFileCount >= 2,
        ids("documentation", "docs"),
      ),
    ],
    xpReward: 600,
  };

  const security: QuestDraft = {
    kind: "security",
    title: "Shield Protocol",
    description:
      "Add explicit security ownership, dependency maintenance and automated code scanning.",
    targetSkillKey: "security",
    criteria: [
      "Add a SECURITY policy",
      "Enable Dependabot or Renovate",
      "Enable CodeQL or dependency review in CI",
    ],
    objectives: [
      completedObjective(
        "policy",
        facts.hasSecurityPolicy,
        ids("security", "policy"),
      ),
      completedObjective(
        "dependency-bot",
        facts.hasDependencyBot,
        ids("security", "dependency-bot"),
      ),
      completedObjective(
        "code-scanning",
        facts.hasCodeScanning,
        ids("security", "code-scanning"),
      ),
    ],
    xpReward: 1100,
  };

  const hardening: QuestDraft = {
    kind: "hardening",
    title: "Proof Hardening",
    description:
      "Increase the quality of the repository evidence before unlocking a larger challenge.",
    targetSkillKey: "typescript",
    criteria: [
      "Keep strict typing enabled",
      "Document the architecture",
      "Run type checking in CI",
    ],
    objectives: [
      completedObjective(
        "strict",
        facts.typescriptStrict,
        ids("typescript", "strict"),
      ),
      completedObjective(
        "architecture",
        facts.hasArchitectureDoc,
        [],
      ),
      completedObjective(
        "typecheck-ci",
        facts.ciRunsTypecheck,
        ids("typescript", "ci-typecheck"),
      ),
    ],
    xpReward: 700,
  };

  const dockerSkill = skills.find((skill) => skill.id === "docker");
  const candidates = [testing, docker, cicd, documentation, security];

  if ((dockerSkill?.progress ?? 0) >= 55 || facts.hasDeployment) {
    candidates.push(kubernetes);
  }

  candidates.push(hardening);

  return candidates.filter((quest) =>
    quest.objectives.some((objective) => !objective.completed),
  );
}

export function chooseQuest(
  facts: DeepFacts,
  evidence: Evidence[],
  skills: SkillNode[],
): QuestDraft {
  const deck = buildQuestDeck(facts, evidence, skills);

  if (deck.length > 0) return deck[0];

  return {
    kind: "hardening",
    title: "Proof Hardening",
    description:
      "Keep the repository evidence healthy while ProofQuest prepares a larger challenge.",
    targetSkillKey: "typescript",
    criteria: [
      "Keep strict typing enabled",
      "Keep architecture documentation current",
      "Keep type checking in CI",
    ],
    objectives: [
      completedObjective("strict", true, []),
      completedObjective("architecture", true, []),
      completedObjective("typecheck-ci", true, []),
    ],
    xpReward: 700,
  };
}
