import Link from "next/link";
import { Brand } from "@/components/Brand";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getAuthCopy } from "@/lib/auth-i18n";
import { getLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const locale = await getLocale();
  const copy = getAuthCopy(locale);
  const { reason } = await searchParams;

  return (
    <main className="site-shell analyze-page">
      <header className="topbar"><Brand /><LocaleSwitcher locale={locale} /></header>
      <section className="analysis-error-card">
        <span className="micro-label">PROOFQUEST CLOUD</span>
        <h1>{copy.authErrorTitle}</h1>
        <p>{copy.authErrorBody}</p>
        {reason ? <code className="auth-error-reason">{reason.slice(0, 240)}</code> : null}
        <div className="hero-actions"><Link className="cta" href="/">{copy.backHome} →</Link></div>
      </section>
    </main>
  );
}
