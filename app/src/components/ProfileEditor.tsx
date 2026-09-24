"use client";

import { useState, type FormEvent } from "react";
import { updateProfile } from "@/app/settings/profile/actions";
import type { ProfileInput } from "@/lib/profile-input";
import { getProductCopy } from "@/lib/product-i18n";
import type { Locale } from "@/lib/i18n";

export function ProfileEditor({ initial, locale }: { initial: ProfileInput; locale: Locale }) {
  const t = getProductCopy(locale);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"saved" | "invalid" | "error" | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setStatus(null);
    try {
      setStatus(await updateProfile({ headline: form.get("headline"), bio: form.get("bio"), public_links: String(form.get("links") ?? "").split(/\r?\n/).map((v) => v.trim()).filter(Boolean) }));
    } catch { setStatus("error"); }
    finally { setBusy(false); }
  }
  return <form className="profile-editor panel" onSubmit={submit}>
    <h1>{t.edit}</h1><p>{t.privacy}</p>
    <label htmlFor="headline">{t.headline} · 80<input id="headline" name="headline" defaultValue={initial.headline} maxLength={80} disabled={busy} /></label>
    <label htmlFor="bio">{t.bio} · 500<textarea id="bio" name="bio" defaultValue={initial.bio} maxLength={500} rows={5} disabled={busy} /></label>
    <label htmlFor="links">{t.links}<textarea id="links" name="links" defaultValue={initial.public_links.join("\n")} maxLength={902} rows={3} disabled={busy} /></label>
    <button className="cta" disabled={busy}>{busy ? t.saving : t.save}</button>
    <p role="status" aria-live="polite">{status ? t[status] : ""}</p>
  </form>;
}
