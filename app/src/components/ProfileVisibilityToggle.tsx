"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAuthCopy } from "@/lib/auth-i18n";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function ProfileVisibilityToggle({
  userId,
  initialPublic,
  locale,
}: {
  userId: string;
  initialPublic: boolean;
  locale: Locale;
}) {
  const copy = getAuthCopy(locale);
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !isPublic;
    const { error } = await createClient()
      .from("profiles")
      .update({ is_public: next })
      .eq("user_id", userId);

    if (!error) {
      setIsPublic(next);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <button className="profile-visibility-toggle" type="button" onClick={toggle} disabled={busy}>
      <span className={isPublic ? "status-dot" : "account-dot"} />
      {isPublic ? copy.hide : copy.publish}
    </button>
  );
}
