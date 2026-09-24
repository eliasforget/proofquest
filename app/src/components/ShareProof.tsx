"use client";

import { useState } from "react";
import { getProductCopy } from "@/lib/product-i18n";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { recordFunnelEvent } from "@/lib/funnel";

export function ShareProof({ path, title, locale }: { path: string; title: string; locale: Locale }) {
  const t = getProductCopy(locale);
  const [feedback, setFeedback] = useState("");
  const [fallback, setFallback] = useState("");
  const [busy, setBusy] = useState(false);
  async function share(copyOnly: boolean) {
    setBusy(true); setFeedback(""); setFallback("");
    const url = new URL(path, window.location.origin);
    url.searchParams.set("lang", locale);
    try {
      if (!copyOnly && navigator.share) {
        await navigator.share({ title, url: url.href }); setFeedback(t.shared);
      } else { await navigator.clipboard.writeText(url.href); setFeedback(t.copied); }
      // Anonymous shares work too, without collecting visitor identifiers.
      void (async () => {
        const client = createClient();
        const { data: { user } } = await client.auth.getUser();
        if (user) await recordFunnelEvent(client, user.id, "proof_share");
      })().catch(() => {});
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) { setFeedback(t.shareError); setFallback(url.href); }
    } finally { setBusy(false); }
  }
  return <div className="proof-share">
    <button className="cta compact-cta" disabled={busy} onClick={() => share(false)}>{t.share} ↗</button>
    <button className="ghost compact" disabled={busy} onClick={() => share(true)}>{t.copy}</button>
    <span role="status" aria-live="polite">{feedback}</span>
    {fallback ? <input aria-label={t.copy} readOnly value={fallback} onFocus={(event) => event.target.select()} /> : null}
  </div>;
}
