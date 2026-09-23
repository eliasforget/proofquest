import Link from "next/link";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { MetricList } from "@/components/MetricList";
import { SkillTree } from "@/components/SkillTree";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="dashboard-shell">
      <header className="topbar dashboard-top">
        <Brand />
        <div className="topbar-cluster"><div className="demo-badge">{t.demo.data}</div><LocaleSwitcher locale={locale} /><Link className="ghost compact" href="/">{t.demo.exit}</Link></div>
      </header>

      <section className="dashboard-grid">
        <aside className="panel profile-panel">
          <div className="micro-label">{t.demo.buildId}</div><div className="avatar-orb">E</div><h1>Elias</h1><p className="muted">{t.demo.role}</p>
          <div className="level-block"><span>{t.common.level}</span><strong>27</strong><small>6,840 / 8,000 XP</small></div>
          <MetricList locale={locale} />
        </aside>

        <section className="panel graph-panel">
          <div className="panel-head"><div><span className="micro-label">{t.demo.constellation}</span><h2>{t.demo.map}</h2></div><span className="live-chip">{t.demo.nodes}</span></div>
          <SkillTree locale={locale} />
          <div className="graph-legend"><span><i className="legend-core" /> {t.dashboard.primary}</span><span><i /> {t.dashboard.graphDetected}</span><span><i className="legend-lock" /> {t.common.locked}</span></div>
        </section>

        <aside className="side-stack">
          <section className="panel quest-panel"><div className="micro-label">{t.demo.currentQuest}</div><div className="quest-icon">⌁</div><h2>{t.demo.questTitle}</h2><p>{t.demo.questDescription}</p><div className="quest-progress"><span style={{ width: "33%" }} /></div><div className="quest-meta"><span>{t.demo.objective}</span><strong>+850 XP</strong></div></section>
          <section className="panel evidence-panel"><div className="panel-head"><div><span className="micro-label">{t.demo.latest}</span><h2>{t.demo.signals}</h2></div></div><ul>{t.demo.evidence.map((item, i) => <li key={item}><span>0{i + 1}</span><p>{item}</p><b>✓</b></li>)}</ul></section>
        </aside>
      </section>
    </main>
  );
}
