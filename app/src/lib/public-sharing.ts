import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { isLocale, defaultLocale, questTitleFor, type Locale } from "@/lib/i18n";
import { getProductCopy } from "@/lib/product-i18n";
import { getLocale } from "@/lib/locale-server";

export type PublicRoute = { username: string; kind?: string; owner?: string; repo?: string };
export type PublicSearch = Promise<{ lang?: string | string[] }>;

export async function sharingLocale(searchParams?: PublicSearch): Promise<Locale> {
  const lang = (await searchParams)?.lang;
  return typeof lang === "string" && isLocale(lang) ? lang : getLocale();
}

export function publicPath(route: PublicRoute) {
  const path = `/u/${encodeURIComponent(route.username)}`;
  return route.kind && route.owner && route.repo
    ? `${path}/proof/${[route.kind, route.owner, route.repo].map(encodeURIComponent).join("/")}` : path;
}

// Anonymous reads for metadata and images: owner cookies can never expose private data.
// Request memoization only, no persistent cache after visibility changes.
export const loadPublicCard = cache(async (route: PublicRoute, locale: Locale) => {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(route.username)) return null;
  const { url, publishableKey } = getSupabasePublicConfig();
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  const { data: profile, error } = await client.from("profiles")
    .select("user_id,username,display_name,headline,bio")
    .eq("username", route.username.toLowerCase()).eq("is_public", true).maybeSingle();
  if (error || !profile) return null;
  const t = getProductCopy(locale);
  const name = String(profile.display_name || profile.username);
  if (!route.kind) return { title: `${name} · ${t.portfolio}`, description: String(profile.headline || profile.bio || t.portfolio), name, badge: t.portfolio, detail: `@${profile.username}`, reward: null };
  const { data: quest } = await client.from("quest_history")
    .select("kind,repository_full_name,xp_reward,verified_commit_sha")
    .eq("user_id", profile.user_id).eq("kind", route.kind)
    .eq("repository_full_name", `${route.owner}/${route.repo}`)
    .not("verified_commit_sha", "is", null).maybeSingle();
  if (!quest) return null;
  const questTitle = questTitleFor(quest.kind as Parameters<typeof questTitleFor>[0], locale);
  return { title: `${questTitle} · ${name}`, description: `${t.verified} · ${quest.repository_full_name} · +${quest.xp_reward} XP`, name, badge: t.verified, detail: `${quest.repository_full_name} · ${String(quest.verified_commit_sha).slice(0, 7)}`, reward: Number(quest.xp_reward) };
});

export async function publicMetadata(route: PublicRoute, locale: Locale): Promise<Metadata> {
  const card = await loadPublicCard(route, locale);
  if (!card) return { title: getProductCopy(locale).unavailable, robots: { index: false, follow: false }, openGraph: null, twitter: null };
  // Explicit deployment origin; never construct canonical URLs from untrusted Host headers.
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const path = `${publicPath(route)}?lang=${locale}`;
  const query = new URLSearchParams({ username: route.username, lang: locale });
  if (route.kind && route.owner && route.repo) { query.set("kind", route.kind); query.set("owner", route.owner); query.set("repo", route.repo); }
  const images = origin ? [{ url: new URL(`/api/og?${query}`, origin).href, width: 1200, height: 630, alt: card.title }] : undefined;
  return {
    title: `${card.title} · ProofQuest`, description: card.description,
    alternates: origin ? { canonical: new URL(path, origin).href } : undefined,
    openGraph: { title: card.title, description: card.description, siteName: "ProofQuest", type: "website", locale: { fr: "fr_FR", en: "en_US", de: "de_DE", es: "es_ES" }[locale], url: origin ? new URL(path, origin).href : undefined, images },
    twitter: { card: "summary_large_image", title: card.title, description: card.description, images: images?.map((image) => image.url) },
  };
}

export function imageLocale(value: string | null): Locale { return isLocale(value) ? value : defaultLocale; }
