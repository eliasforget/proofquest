"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountSnapshot } from "@/lib/auth";
import { getAuthCopy } from "@/lib/auth-i18n";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function AccountControl({
  account,
  locale,
}: {
  account: AccountSnapshot;
  locale: Locale;
}) {
  const copy = getAuthCopy(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    });
    if (error) {
      setBusy(false);
      router.push(`/auth/error?reason=${encodeURIComponent(error.message)}`);
    }
  }

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!account.signedIn) {
    return (
      <button className="account-pill account-login" onClick={signIn} disabled={busy} type="button">
        {busy ? "…" : copy.signIn}
      </button>
    );
  }

  return (
    <div className="account-cluster">
      <Link className="account-pill account-profile" href="/onboarding">{copy.myRepos}</Link>
      <Link className="account-pill" href="/progress">{copy.myProgress}</Link>
      <button className="account-pill" onClick={signOut} disabled={busy} type="button">{copy.signOut}</button>
    </div>
  );
}
