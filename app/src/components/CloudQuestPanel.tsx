"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountSnapshot } from "@/lib/auth";
import type { CloudQuestState } from "@/lib/cloud-progression-server";
import type { QuestDraft } from "@/lib/domain";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

const copy = {
  fr: {
    cloud: "PROGRESSION CLOUD",
    start: "Lancer cette quête",
    started: "Quête active",
    verify: "Vérifier sur GitHub",
    completed: "Quête déjà validée",
    notOwner: "Connectez le compte GitHub propriétaire de ce dépôt pour gagner de l'XP.",
    verifying: "Vérification…",
    incomplete: "Les objectifs ne sont pas encore tous détectés.",
    awarded: "Quête validée",
    already: "Déjà récompensée",
    error: "La vérification a échoué.",
    xp: "XP cloud",
  },
  en: {
    cloud: "CLOUD PROGRESSION", start: "Start this quest", started: "Quest active", verify: "Verify on GitHub",
    completed: "Quest already verified", notOwner: "Sign in with the GitHub account that owns this repository to earn XP.",
    verifying: "Verifying…", incomplete: "Not every objective is detected yet.", awarded: "Quest verified",
    already: "Already rewarded", error: "Verification failed.", xp: "Cloud XP",
  },
  de: {
    cloud: "CLOUD-FORTSCHRITT", start: "Quest starten", started: "Quest aktiv", verify: "Auf GitHub prüfen",
    completed: "Quest bereits verifiziert", notOwner: "Mit dem GitHub-Konto des Repository-Eigentümers anmelden, um XP zu verdienen.",
    verifying: "Prüfung…", incomplete: "Noch nicht alle Ziele wurden erkannt.", awarded: "Quest verifiziert",
    already: "Bereits belohnt", error: "Verifizierung fehlgeschlagen.", xp: "Cloud-XP",
  },
  es: {
    cloud: "PROGRESO CLOUD", start: "Iniciar misión", started: "Misión activa", verify: "Verificar en GitHub",
    completed: "Misión ya verificada", notOwner: "Inicie sesión con la cuenta de GitHub propietaria para ganar XP.",
    verifying: "Verificando…", incomplete: "Todavía no se detectan todos los objetivos.", awarded: "Misión verificada",
    already: "Ya recompensada", error: "La verificación falló.", xp: "XP cloud",
  },
} as const;

type VerifyResponse = {
  verified?: boolean;
  awarded?: boolean;
  xpReward?: number;
  totalXp?: number;
  objectives?: Array<{ id: string; completed: boolean }>;
  error?: string;
};

export function CloudQuestPanel({
  account,
  repositoryFullName,
  quest,
  state,
  locale,
}: {
  account: AccountSnapshot;
  repositoryFullName: string;
  quest: QuestDraft;
  state: CloudQuestState;
  locale: Locale;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [active, setActive] = useState(state.active);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(state.totalXp);

  async function startQuest() {
    if (!state.eligible || !account.userId) return;
    setBusy(true);
    setFeedback(null);
    const supabase = createClient();
    const { error } = await supabase.from("active_quests").upsert(
      {
        user_id: account.userId,
        repository_full_name: repositoryFullName,
        id: `${quest.kind}:${repositoryFullName.toLowerCase()}`,
        kind: quest.kind,
        xp_reward: quest.xpReward,
        target_skill_key: quest.targetSkillKey,
        started_at: new Date().toISOString(),
        baseline_completed_objective_ids: quest.objectives
          .filter((objective) => objective.completed)
          .map((objective) => objective.id),
        objective_count: quest.objectives.length,
      },
      { onConflict: "user_id,repository_full_name" },
    );
    if (error) {
      setFeedback(t.error);
    } else {
      setActive(true);
      setFeedback(t.started);
    }
    setBusy(false);
  }

  async function verifyQuest() {
    setBusy(true);
    setFeedback(null);
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke<VerifyResponse>("verify-quest", {
      body: {
        repositoryFullName,
        kind: quest.kind,
      },
    });

    if (error || !data) {
      setFeedback(t.error);
      setBusy(false);
      return;
    }

    if (!data.verified) {
      setFeedback(t.incomplete);
      setBusy(false);
      return;
    }

    setTotalXp(Number(data.totalXp ?? totalXp));
    setActive(false);
    setFeedback(
      data.awarded
        ? `${t.awarded} · +${Number(data.xpReward ?? quest.xpReward)} XP`
        : t.already,
    );
    setBusy(false);
    if (data.awarded) {
      window.location.assign(`${window.location.pathname}?rescan=1`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="cloud-quest-runtime">
      <div className="cloud-quest-runtime-head">
        <span className="micro-label">{t.cloud}</span>
        <strong>{totalXp.toLocaleString(locale)} {t.xp}</strong>
      </div>

      {!state.eligible ? <p>{t.notOwner}</p> : state.completed ? (
        <div className="cloud-quest-completed">✓ {t.completed}</div>
      ) : (
        <div className="cloud-quest-actions">
          {!active ? (
            <button className="cta compact-cta" type="button" disabled={busy} onClick={startQuest}>
              {busy ? "…" : t.start} →
            </button>
          ) : (
            <>
              <span className="active-quest-chip"><i className="status-dot" /> {t.started}</span>
              <button className="cta compact-cta" type="button" disabled={busy} onClick={verifyQuest}>
                {busy ? t.verifying : t.verify} ↻
              </button>
            </>
          )}
        </div>
      )}
      {feedback ? <p className="cloud-quest-feedback">{feedback}</p> : null}
    </div>
  );
}
