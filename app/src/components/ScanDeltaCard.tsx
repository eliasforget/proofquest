"use client";

import { useEffect, useMemo, useState } from "react";
import type { RepositoryAnalysis } from "@/lib/domain";
import { getDictionary, questTitleFor, type Locale } from "@/lib/i18n";

type Snapshot = {
  analyzedAt: string;
  level: number;
  evidenceCount: number;
  skills: Array<{ id: string; name: string; progress: number }>;
  fingerprint: string;
  completedQuests: Array<{ kind: RepositoryAnalysis["completedQuests"][number]["kind"]; xpReward: number }>;
};

function snapshotOf(analysis: RepositoryAnalysis): Snapshot {
  const fingerprint = JSON.stringify({
    skills: analysis.skills.map((skill) => [skill.id, skill.progress]),
    evidence: analysis.evidence.map((item) => [item.skillKey, item.type, item.messageKey, item.sourcePath]),
  });

  return {
    analyzedAt: analysis.analyzedAt,
    level: analysis.progression.level,
    evidenceCount: analysis.evidence.length,
    skills: analysis.skills.map((skill) => ({ id: skill.id, name: skill.name, progress: skill.progress })),
    fingerprint,
    completedQuests: analysis.completedQuests,
  };
}

export function ScanDeltaCard({ analysis, locale }: { analysis: RepositoryAnalysis; locale: Locale }) {
  const t = getDictionary(locale);
  const localizedSkillName = (id: string, fallback: string) => (t.skill.names as Record<string, string>)[id] ?? fallback;
  const current = useMemo(() => snapshotOf(analysis), [analysis]);
  const [previous, setPrevious] = useState<Snapshot | null>(null);

  useEffect(() => {
    const key = `proofquest:scan:${analysis.repository.fullName.toLowerCase()}`;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Snapshot;
        if (parsed.analyzedAt !== current.analyzedAt) setPrevious(parsed);
      }
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch {
      // localStorage can be unavailable in private/restricted contexts; the scan still works.
    }
  }, [analysis.repository.fullName, current]);

  const changes = previous
    ? current.skills.flatMap((skill) => {
        const before = previous.skills.find((entry) => entry.id === skill.id);
        if (!before || before.progress === skill.progress) return [];
        return [{ skill, delta: skill.progress - before.progress }];
      })
    : [];

  const evidenceDelta = previous ? current.evidenceCount - previous.evidenceCount : 0;
  const levelDelta = previous ? current.level - previous.level : 0;
  const previousCompleted = new Set(previous?.completedQuests?.map((quest) => quest.kind) ?? []);
  const newlyCompleted = previous ? current.completedQuests.filter((quest) => !previousCompleted.has(quest.kind)) : [];
  const changed = Boolean(previous && (previous.fingerprint !== current.fingerprint || evidenceDelta !== 0 || levelDelta !== 0 || newlyCompleted.length > 0));

  return (
    <section className="scan-delta-card" aria-live="polite">
      <div>
        <span className="micro-label">{t.dashboard.historyTitle}</span>
        <p>{previous ? (changed ? t.dashboard.historyPrevious : t.dashboard.historyNoChange) : t.dashboard.historyEmpty}</p>
      </div>

      {previous && changed ? (
        <div className="scan-delta-stats">
          {newlyCompleted.map((quest) => <span className="quest-delta" key={quest.kind}><b>✓</b> {t.dashboard.historyQuest}: {questTitleFor(quest.kind, locale)}</span>)}
          {evidenceDelta !== 0 ? <span><b>{evidenceDelta > 0 ? "+" : ""}{evidenceDelta}</b> {t.dashboard.historyEvidence}</span> : null}
          {levelDelta !== 0 ? <span><b>{levelDelta > 0 ? "+" : ""}{levelDelta}</b> {t.dashboard.historyLevel}</span> : null}
          {changes.slice(0, 4).map(({ skill, delta }) => (
            <span key={skill.id}><b>{delta > 0 ? "+" : ""}{delta}</b> {localizedSkillName(skill.id, skill.name)}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
