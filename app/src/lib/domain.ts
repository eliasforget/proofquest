export type Evidence = {
  id: string;
  skillKey: string;
  type: string;
  label: string;
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  sourcePath?: string;
  confidence: number;
};

export type SkillState = "core" | "active" | "locked";

export type SkillNode = {
  id: string;
  name: string;
  level: number;
  x: number;
  y: number;
  state: SkillState;
  progress: number;
  evidenceIds: string[];
};

export type SkillAssessment = {
  skillKey: string;
  progressPoints: number;
  evidenceIds: string[];
  summary?: string;
};

export type QuestObjective = {
  id: string;
  completed: boolean;
  evidenceIds: string[];
};

export type QuestDraft = {
  kind: "testing" | "docker" | "kubernetes" | "hardening";
  title: string;
  description: string;
  targetSkillKey: string;
  criteria: string[];
  objectives: QuestObjective[];
  xpReward: number;
};

export type RepositoryAnalysis = {
  repository: {
    owner: string;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    defaultBranch: string;
    primaryLanguage: string | null;
    stars: number;
    forks: number;
    fileCount: number;
    treeTruncated: boolean;
  };
  languages: Array<{
    name: string;
    bytes: number;
    percent: number;
  }>;
  skills: SkillNode[];
  metrics: Array<readonly [string, number]>;
  evidence: Evidence[];
  quest: QuestDraft;
  completedQuests: Array<{ kind: QuestDraft["kind"]; xpReward: number }>;
  progression: {
    level: number;
    currentXp: number;
    nextLevelXp: number;
  };
  analyzedAt: string;
};
