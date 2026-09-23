import { CloudQuestPanel } from "@/components/CloudQuestPanel";
import type { AccountSnapshot } from "@/lib/auth";
import type { CloudQuestState, CloudQuestStates } from "@/lib/cloud-progression-server";
import type { QuestDraft } from "@/lib/domain";
import { questCopy, type Locale } from "@/lib/i18n";

const labels = {
  fr: { deck: "TABLEAU DES QUÊTES", available: "missions disponibles", objectives: "objectifs", multi: "QUÊTES PARALLÈLES" },
  en: { deck: "QUEST DECK", available: "available missions", objectives: "objectives", multi: "PARALLEL QUESTS" },
  de: { deck: "QUEST-TAFEL", available: "verfügbare Missionen", objectives: "Ziele", multi: "PARALLELE QUESTS" },
  es: { deck: "TABLERO DE MISIONES", available: "misiones disponibles", objectives: "objetivos", multi: "MISIONES PARALELAS" },
} as const;

const emptyState: CloudQuestState = {
  eligible: false,
  active: false,
  completed: false,
  totalXp: 0,
};

export function QuestDeck({
  quests,
  repositoryFullName,
  account,
  states,
  locale,
}: {
  quests: QuestDraft[];
  repositoryFullName: string;
  account: AccountSnapshot;
  states: CloudQuestStates;
  locale: Locale;
}) {
  const t = labels[locale];

  if (quests.length === 0) return null;

  return (
    <section className="panel quest-deck-panel">
      <div className="panel-head">
        <div>
          <span className="micro-label">{t.deck}</span>
          <h2>{quests.length} {t.available}</h2>
        </div>
        <span className="live-chip">{t.multi}</span>
      </div>

      <div className="quest-deck-grid">
        {quests.slice(0, 4).map((draft) => {
          const quest = questCopy(draft, locale);
          const completedObjectives = draft.objectives.filter(
            (objective) => objective.completed,
          ).length;
          const progress = draft.objectives.length
            ? Math.round(
                (completedObjectives / draft.objectives.length) * 100,
              )
            : 0;

          return (
            <article className="quest-deck-card" key={draft.kind}>
              <div className="quest-deck-card-top">
                <span className="quest-kind-chip">{draft.kind.toUpperCase()}</span>
                <strong>+{draft.xpReward} XP</strong>
              </div>
              <h3>{quest.title}</h3>
              <p>{quest.description}</p>

              <ol className="quest-criteria quest-criteria-live">
                {quest.criteria.map((criterion, index) => {
                  const done = draft.objectives[index]?.completed === true;
                  return (
                    <li
                      key={criterion}
                      className={
                        done ? "objective-done" : "objective-pending"
                      }
                    >
                      <span className="objective-state">
                        {done ? "✓" : "○"}
                      </span>
                      {criterion}
                    </li>
                  );
                })}
              </ol>

              <div className="quest-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="quest-meta">
                <span>
                  {completedObjectives} / {draft.objectives.length} {t.objectives}
                </span>
                <strong>{progress}%</strong>
              </div>

              <CloudQuestPanel
                account={account}
                repositoryFullName={repositoryFullName}
                quest={draft}
                state={states[draft.kind] ?? emptyState}
                locale={locale}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
