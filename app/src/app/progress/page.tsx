import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ProfileVisibilityToggle } from "@/components/ProfileVisibilityToggle";
import { getAccountSnapshot } from "@/lib/auth";
import { getAuthCopy } from "@/lib/auth-i18n";
import { getLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function levelFromXp(totalXp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, totalXp) / 450)) + 1);
}

export default async function ProgressPage() {
  const locale = await getLocale();
  const copy = getAuthCopy(locale);
  const account = await getAccountSnapshot();

  if (!account.signedIn || !account.userId) {
    return (
      <main className="site-shell onboarding-shell">
        <header className="topbar"><Brand /><LocaleSwitcher locale={locale} /></header>
        <section className="onboarding-intro panel"><h1>{copy.loginTitle}</h1><p>{copy.loginBody}</p><AccountControl account={account} locale={locale} /></section>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: progress }, { data: quests }] = await Promise.all([
    supabase.from("player_progress").select("total_xp,updated_at").eq("user_id", account.userId).maybeSingle(),
    supabase.from("quest_history").select("id,repository_full_name,kind,xp_reward,completed_at").eq("user_id", account.userId).order("completed_at", { ascending: false }).limit(12),
  ]);

  const totalXp = Number(progress?.total_xp ?? 0);
  const level = levelFromXp(totalXp);

  return (
    <main className="dashboard-shell progress-page-shell">
      <header className="topbar dashboard-top"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
      <section className="progress-cloud-hero panel">
        <div>
          <span className="eyebrow">PROOFQUEST IDENTITY</span>
          <h1>{account.displayName || account.username}</h1>
          <p>@{account.username}</p>
        </div>
        <div className="public-level-orb"><span>LEVEL</span><strong>{level}</strong><small>{totalXp.toLocaleString(locale)} XP</small></div>
        <div className="progress-cloud-actions">
          <ProfileVisibilityToggle userId={account.userId} initialPublic={Boolean(account.isPublic)} locale={locale} />
          {account.isPublic && account.username ? <Link className="ghost compact" href={`/u/${account.username}`}>{copy.publicProfile} ↗</Link> : null}
        </div>
      </section>

      <section className="panel progress-history-panel">
        <div className="panel-head"><div><span className="micro-label">{copy.recentQuests}</span><h2>{quests?.length ?? 0}</h2></div></div>
        {quests?.length ? (
          <div className="public-quest-grid">
            {quests.map((quest) => (
              <article key={String(quest.id)}>
                <span className="public-quest-check">✓</span>
                <div><strong>{String(quest.kind).toUpperCase()}</strong><p>{quest.repository_full_name}</p><small>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(quest.completed_at))}</small></div>
                <b>+{quest.xp_reward} XP</b>
              </article>
            ))}
          </div>
        ) : <p className="progress-empty">{copy.noHistory}</p>}
      </section>
    </main>
  );
}
