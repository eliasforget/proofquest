export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

const DEFAULT_URL = "https://vlgpwhcrlczyzqtdqqes.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_nyKOHpXR7Kucwk-3cKmZwg_F6chdA6B";

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      DEFAULT_PUBLISHABLE_KEY,
  };
}
