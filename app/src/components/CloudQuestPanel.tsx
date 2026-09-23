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
    verify: "Vérifier ma contribution",
    completed: "Quête déjà validée",
    unavailable:
      "Reconnectez GitHub pour lier votre identité durable avant de gagner de l'XP.",
    verifying: "Vérification…",
    incomplete: "Les objectifs ne sont pas encore tous détectés.",
    noContribution:
      "Aucun commit pertinent de votre compte GitHub n'a été trouvé après le lancement de la quête.",
    noProgress:
      "Aucun nouvel objectif n'a été débloqué depuis le lancement de la quête.",
    alreadyComplete:
      "Cette quête est déjà complète dans le dépôt. Choisissez une autre mission.",
    notActive: "Cette quête n'est plus active. Relancez-la avant de vérifier.",
    awarded: "Quête vérifiée",
    already: "Déjà récompensée",
    error: "La vérification a échoué.",
    xp: "XP cloud",
    proof: "Commit preuve",
  },
  en: {
    cloud: "CLOUD PROGRESSION",
    start: "Start this quest",
    started: "Quest active",
    verify: "Verify my contribution",
    completed: "Quest already verified",
    unavailable: "Reconnect GitHub to bind your durable identity before earning XP.",
    verifying: "Verifying…",
    incomplete: "Not every objective is detected yet.",
    noContribution: "No relevant commit from your GitHub account was found after the quest started.",
    noProgress: "No new objective was unlocked since the quest started.",
    alreadyComplete: "This quest is already complete in the repository. Pick another mission.",
    notActive: "This quest is no longer active. Start it again before verifying.",
    awarded: "Quest verified",
    already: "Already rewarded",
    error: "Verification failed.",
    xp: "Cloud XP",
    proof: "Proof commit",
  },
  de: {
    cloud: "CLOUD-FORTSCHRITT",
    start: "Quest starten",
    started: "Quest aktiv",
    verify: "Meinen Beitrag prüfen",
    completed: "Quest bereits verifiziert",
    unavailable: "GitHub erneut verbinden, um die dauerhafte Identität vor XP zu verknüpfen.",
    verifying: "Prüfung…",
    incomplete: "Noch nicht alle Ziele wurden erkannt.",
    noContribution: "Nach Quest-Start wurde kein relevanter Commit Ihres GitHub-Kontos gefunden.",
    noProgress: "Seit Quest-Start wurde kein neues Ziel freigeschaltet.",
    alreadyComplete: "Diese Quest ist im Repository bereits abgeschlossen. Wählen Sie eine andere.",
    notActive: "Diese Quest ist nicht mehr aktiv. Starten Sie sie vor der Prüfung erneut.",
    awarded: "Quest verifiziert",
    already: "Bereits belohnt",
    error: "Verifizierung fehlgeschlagen.",
    xp: "Cloud-XP",
    proof: "Beweis-Commit",
  },
  es: {
    cloud: "PROGRESO CLOUD",
    start: "Iniciar misión",
    started: "Misión activa",
    verify: "Verificar mi contribución",
    completed: "Misión ya verificada",
    unavailable: "Vuelva a conectar GitHub para vincular su identidad duradera antes de ganar XP.",
    verifying: "Verificando…",
    incomplete: "Todavía no se detectan todos los objetivos.",
    noContribution: "No se encontró ningún commit relevante de su cuenta de GitHub después de iniciar la misión.",
    noProgress: "No se desbloqueó ningún objetivo nuevo desde el inicio de la misión.",
    alreadyComplete: "Esta misión ya está completa en el repositorio. Elija otra.",
    notActive: "Esta misión ya no está activa. Iníciela de nuevo antes de verificar.",
    awarded: "Misión verificada",
    already: "Ya recompensada",
    error: "La verificación falló.",
    xp: "XP cloud",
    proof: "Commit de prueba",
  },
} as const;

type VerifyResponse = {
  code?: string;
  active?: boolean;
  verified?: boolean;
  awarded?: boolean;
  xpReward?: number;
  totalXp?: number;
  commitSha?: string;
  commitUrl?: string;
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
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(state.totalXp);

  function feedbackForCode(code?: string) {
    if (code === "objectives_incomplete") return t.incomplete;
    if (code === "contribution_not_found") return t.noContribution;
    if (code === "no_new_objective") return t.noProgress;
    if (code === "quest_already_complete") return t.alreadyComplete;
    if (code === "quest_not_active") return t.notActive;
    return t.error;
  }

  async function invoke(action: "start" | "verify") {
    const supabase = createClient();
    return supabase.functions.invoke<VerifyResponse>("verify-quest", {
      body: {
        action,
        repositoryFullName,
        kind: quest.kind,
      },
    });
  }

  async function startQuest() {
    if (!state.eligible || !account.userId || !account.githubUserId) return;

    setBusy(true);
    setFeedback(null);
    setProofUrl(null);

    const { data, error } = await invoke("start");

    if (error || !data?.active) {
      setFeedback(feedbackForCode(data?.code));
      setBusy(false);
      return;
    }

    setActive(true);
    setFeedback(t.started);
    setBusy(false);
    router.refresh();
  }

  async function verifyQuest() {
    setBusy(true);
    setFeedback(null);
    setProofUrl(null);

    const { data, error } = await invoke("verify");

    if (error || !data) {
      setFeedback(t.error);
      setBusy(false);
      return;
    }

    if (!data.verified) {
      setFeedback(feedbackForCode(data.code));
      if (data.code === "quest_not_active") setActive(false);
      setBusy(false);
      return;
    }

    setTotalXp(Number(data.totalXp ?? totalXp));
    setActive(false);
    setProofUrl(data.commitUrl ?? null);
    setFeedback(
      data.awarded
        ? `${t.awarded} · +${Number(data.xpReward ?? quest.xpReward)} XP`
        : t.already,
    );
    setBusy(false);

    if (data.awarded) {
      window.setTimeout(() => {
        window.location.assign(`${window.location.pathname}?rescan=1`);
      }, 650);
      return;
    }

    router.refresh();
  }

  return (
    <div className="cloud-quest-runtime">
      <div className="cloud-quest-runtime-head">
        <span className="micro-label">{t.cloud}</span>
        <strong>
          {totalXp.toLocaleString(locale)} {t.xp}
        </strong>
      </div>

      {!state.eligible ? (
        <p>{t.unavailable}</p>
      ) : state.completed ? (
        <div className="cloud-quest-completed">✓ {t.completed}</div>
      ) : (
        <div className="cloud-quest-actions">
          {!active ? (
            <button
              className="cta compact-cta"
              type="button"
              disabled={busy}
              onClick={startQuest}
            >
              {busy ? "…" : t.start} →
            </button>
          ) : (
            <>
              <span className="active-quest-chip">
                <i className="status-dot" /> {t.started}
              </span>
              <button
                className="cta compact-cta"
                type="button"
                disabled={busy}
                onClick={verifyQuest}
              >
                {busy ? t.verifying : t.verify} ↻
              </button>
            </>
          )}
        </div>
      )}

      {feedback ? <p className="cloud-quest-feedback">{feedback}</p> : null}
      {proofUrl ? (
        <a
          className="cloud-proof-link"
          href={proofUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t.proof} ↗
        </a>
      ) : null}
    </div>
  );
}
