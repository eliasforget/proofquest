import { recordFunnelEvent } from "@/lib/funnel";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/onboarding";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error?reason=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/error?reason=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) await recordFunnelEvent(supabase, user.id, "login");

  const response = NextResponse.redirect(new URL(next, url.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
