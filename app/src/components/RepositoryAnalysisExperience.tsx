"use client";

import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { RepositoryDashboard } from "@/components/RepositoryDashboard";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { RepositoryAnalysis } from "@/lib/domain";

export function RepositoryAnalysisExperience({ analysis, locale }: { analysis: RepositoryAnalysis; locale: Locale }) {
  const t = getDictionary(locale).scan;
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    if (step < t.events.length) {
      const timer = window.setTimeout(() => setStep((current) => current + 1), 430);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setRevealed(true), 500);
    return () => window.clearTimeout(timer);
  }, [step, revealed, t.events.length]);

  if (revealed) return <RepositoryDashboard analysis={analysis} locale={locale} />;

  return (
    <main className="site-shell analyze-page">
      <header className="topbar"><Brand /><div className="topbar-cluster"><div className="top-actions"><span className="status-dot" /> {t.live}</div><LocaleSwitcher locale={locale} /></div></header>
      <section className="scan-layout">
        <div className="scanner">
          <div className="scanner-ring ring-a" /><div className="scanner-ring ring-b" />
          <div className="scanner-core"><span>BUILD</span><strong>{analysis.progression.level}</strong></div><div className="scan-beam" />
        </div>
        <div className="scan-copy">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.mapping.replace("{repo}", analysis.repository.name)}</h1>
          <p>{t.intro}</p>
          <div className="terminal">
            {t.events.map((event, index) => {
              const found = index < step;
              return <div key={event} className={found ? "terminal-found" : "terminal-pending"}><span>{String(index + 1).padStart(2, "0")}</span>{event}<b>{found ? t.found : t.wait}</b></div>;
            })}
          </div>
          <div className="scan-progress"><span style={{ width: `${Math.min(100, (step / t.events.length) * 100)}%` }} /></div>
        </div>
      </section>
    </main>
  );
}
