import type { SkillNode } from "@/lib/domain";

export const skills: SkillNode[] = [
  { id: "typescript", name: "TypeScript", level: 8, progress: 80, evidenceIds: [], x: 50, y: 12, state: "core" },
  { id: "next", name: "Next.js", level: 6, progress: 60, evidenceIds: [], x: 29, y: 40, state: "active" },
  { id: "react", name: "React", level: 7, progress: 70, evidenceIds: [], x: 71, y: 40, state: "active" },
  { id: "postgres", name: "PostgreSQL", level: 4, progress: 40, evidenceIds: [], x: 18, y: 72, state: "active" },
  { id: "testing", name: "Testing", level: 3, progress: 30, evidenceIds: [], x: 50, y: 75, state: "active" },
  { id: "docker", name: "Docker", level: 4, progress: 40, evidenceIds: [], x: 82, y: 72, state: "active" },
  { id: "kubernetes", name: "Kubernetes", level: 0, progress: 0, evidenceIds: [], x: 92, y: 92, state: "locked" },
];

export const metrics: Array<readonly [string, number]> = [
  ["Backend", 82],
  ["Frontend", 74],
  ["Database", 61],
  ["DevOps", 43],
  ["Testing", 31],
];

export const evidence = [
  "TypeScript strict mode detected",
  "GitHub Actions workflow found",
  "12 test/spec files mapped",
  "Docker multi-stage build detected",
];
