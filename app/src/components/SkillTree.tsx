"use client";

import { useState } from "react";
import { skills as demoSkills } from "@/data/mock-profile";
import type { Evidence, QuestDraft, SkillNode } from "@/lib/domain";
import { evidenceLabel, evidenceStrength, getDictionary, milestoneFor, questCopy, skillName, type Locale } from "@/lib/i18n";

const links = [["typescript", "next"], ["typescript", "react"], ["next", "postgres"], ["typescript", "testing"], ["react", "docker"], ["docker", "kubernetes"]] as const;

export function SkillTree({
  skills = demoSkills,
  evidence = [],
  locale = "fr",
  repositoryUrl,
  defaultBranch,
  quest,
}: {
  skills?: SkillNode[];
  evidence?: Evidence[];
  locale?: Locale;
  repositoryUrl?: string;
  defaultBranch?: string;
  quest?: QuestDraft;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const byId = Object.fromEntries(skills.map((skill) => [skill.id, skill]));
  const selected = selectedId ? byId[selectedId] : undefined;
  const selectedEvidence = selected ? evidence.filter((item) => item.skillKey === selected.id) : [];
  const t = getDictionary(locale);
  const translatedQuest = quest ? questCopy(quest, locale) : null;

  return (
    <div className="skill-map" aria-label={t.dashboard.constellation}>
      <svg className="skill-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {links.map(([from, to]) => {
          const a = byId[from]; const b = byId[to];
          if (!a || !b) return null;
          return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </svg>

      {skills.map((skill) => (
        <button
          type="button"
          key={skill.id}
          className={`skill-node ${skill.state} ${selectedId === skill.id ? "selected" : ""}`}
          style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
          title={`${skillName(skill, locale)}: ${skill.progress}%`}
          onClick={() => setSelectedId(skill.id)}
          aria-label={`${skillName(skill, locale)} — ${skill.progress}%`}
        >
          <span className="skill-dot" />
          <strong>{skillName(skill, locale)}</strong>
          <small>{skill.state === "locked" ? t.common.locked : `${t.common.level} ${skill.level}`}</small>
        </button>
      ))}

      {selected ? (
        <aside className="skill-detail" role="dialog" aria-label={`${t.skill.detail}: ${skillName(selected, locale)}`}>
          <button className="skill-detail-close" type="button" onClick={() => setSelectedId(null)} aria-label={t.common.close}>×</button>
          <div className="micro-label">{t.skill.detail}</div>
          <h3>{skillName(selected, locale)}</h3>
          <div className="skill-detail-level"><strong>{selected.state === "locked" ? "—" : selected.level}</strong><span>{selected.state === "locked" ? t.common.locked : t.common.level}</span></div>

          <div className="skill-detail-score-head"><span>{t.skill.evidenceScore}</span><b>{selected.progress}%</b></div>
          <div className="skill-detail-progress"><span style={{ width: `${selected.progress}%` }} /></div>
          <div className="skill-strength"><span>{t.skill.strength}</span><strong>{evidenceStrength(selected.progress, locale)}</strong></div>

          <section className="skill-detail-section">
            <div className="micro-label">{t.skill.why}</div>
            {selectedEvidence.length ? (
              <ul className="skill-evidence-list">
                {selectedEvidence.map((item) => {
                  const href = item.sourcePath && repositoryUrl && defaultBranch
                    ? `${repositoryUrl}/blob/${encodeURIComponent(defaultBranch)}/${item.sourcePath.split("/").map(encodeURIComponent).join("/")}`
                    : undefined;
                  return (
                    <li key={item.id}>
                      <span className="evidence-check">✓</span>
                      <div><p>{evidenceLabel(item, locale)}</p>{item.sourcePath ? (href ? <a href={href} target="_blank" rel="noreferrer">{item.sourcePath} ↗</a> : <small>{item.sourcePath}</small>) : null}</div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="skill-empty">{t.common.noEvidence}</p>}
          </section>

          <section className="skill-detail-section">
            <div className="micro-label">{t.skill.next}</div>
            <p className="skill-milestone">{milestoneFor(selected.progress, selected.state, locale)}</p>
          </section>

          {quest && translatedQuest && quest.targetSkillKey === selected.id ? (
            <section className="skill-detail-section linked-quest">
              <div className="micro-label">{t.skill.linkedQuest}</div>
              <strong>{translatedQuest.title}</strong>
              <span>+{quest.xpReward} XP</span>
            </section>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
