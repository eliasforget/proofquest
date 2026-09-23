import Link from "next/link";
import { AccountControl } from "@/components/AccountControl";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getAccountSnapshot, getPublicProfile } from "@/lib/auth";
import { getAuthCopy } from "@/lib/auth-i18n";
import { getLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function levelFromXp(totalXp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, totalXp) / 450)) + 1);
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [{ username }, locale, account] = await Promise.all([
    params,
    getLocale(),
    getAccountSnapshot(),
  ]);
  const copy = getAuthCopy(locale);
  const profile = await getPublicProfile(username);

  if (!profile) {
    return (
      <main className="site-shell public-profile-shell">
        <header className="topbar"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
        <section className="analysis-error-card"><h1>Profil introuvable</h1><p>Ce profil est privé ou n'existe pas.</p><Link className="cta" href="/">{copy.backHome} →</Link></section>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: progress }, { data: quests }] = await Promise.all([
    supabase.from("player_progress").select("total_xp").eq("user_id", profile.user_id).maybeSingle(),
    supabase.from("quest_history").select("id,repository_full_name,kind,xp_reward,completed_at").eq("user_id", profile.user_id).order("completed_at", { ascending: false }).limit(12),
  ]);
  const totalXp = Number(progress?.total_xp ?? 0);

  return (
    <main className="dashboard-shell public-profile-shell">
      <header className="topbar dashboard-top"><Brand /><div className="topbar-cluster"><LocaleSwitcher locale={locale} /><AccountControl account={account} locale={locale} /></div></header>
      <section className="public-profile-hero panel">
        <div className="public-profile-identity">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" /> : <div className="public-avatar-fallback">{profile.username.slice(0, 1).toUpperCase()}</div>}
          <div><span className="micro-label">PUBLIC PROOF PROFILE</span><h1>{profile.display_name || profile.username}</h1><p>@{profile.username}</p></div>
        </div>
        <div className="public-level-orb"><span>PROOFQUEST LEVEL</span><strong>{levelFromXp(totalXp)}</strong><small>{totalXp.toLocaleString(locale)} XP</small></div>
      </section>
      <section className="panel public-history-panel">
        <div className="panel-head"><div><span className="micro-label">{copy.recentQuests}</span><h2>{quests?.length ?? 0}</h2></div></div>
        {quests?.length ? <div className="public-quest-grid">{quests.map((quest) => <article key={String(quest.id)}><span className="public-quest-check">✓</span><div><strong>{String(quest.kind).toUpperCase()}</strong><p>{quest.repository_full_name}</p><small>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(quest.completed_at))}</small></div><b>+{quest.xp_reward} XP</b></article>)}</div> : <p className="progress-empty">{copy.noHistory}</p>}
      </section>
    </main>
  );
}
