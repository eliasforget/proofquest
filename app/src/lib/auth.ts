import { createClient } from "@/lib/supabase/server";

export type AccountSnapshot = {
  signedIn: boolean;
  userId?: string;
  username?: string;
  githubUserId?: number;
  displayName?: string;
  avatarUrl?: string;
  isPublic?: boolean;
};

export type ProfileRecord = {
  user_id: string;
  username: string;
  github_user_id: number | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

function githubUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(normalized)
    ? normalized
    : null;
}

function githubUserId(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

const profileFields =
  "user_id,username,github_user_id,display_name,avatar_url,bio,is_public,created_at,updated_at";

export async function ensureCurrentProfile(): Promise<ProfileRecord | null> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const user = authData.user;
  const { data: existing } = await supabase
    .from("profiles")
    .select(profileFields)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing as ProfileRecord;

  const metadata = user.user_metadata ?? {};
  const base =
    githubUsername(metadata.user_name) ??
    githubUsername(metadata.preferred_username) ??
    githubUsername(user.email?.split("@")[0]) ??
    `dev-${user.id.slice(0, 8)}`;

  const providerId =
    githubUserId(metadata.provider_id) ?? githubUserId(metadata.sub);

  const { data } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      username: base,
      github_user_id: providerId,
      display_name:
        typeof metadata.full_name === "string"
          ? metadata.full_name.slice(0, 80)
          : base,
      avatar_url:
        typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
      is_public: false,
    })
    .select(profileFields)
    .maybeSingle();

  return (data as ProfileRecord | null) ?? null;
}

export async function getAccountSnapshot(): Promise<AccountSnapshot> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { signedIn: false };

  const profile = await ensureCurrentProfile();
  const metadata = data.user.user_metadata ?? {};

  return {
    signedIn: true,
    userId: data.user.id,
    username:
      profile?.username ??
      githubUsername(metadata.user_name) ??
      githubUsername(metadata.preferred_username) ??
      undefined,
    githubUserId:
      profile?.github_user_id ??
      githubUserId(metadata.provider_id) ??
      githubUserId(metadata.sub) ??
      undefined,
    displayName:
      profile?.display_name ??
      (typeof metadata.full_name === "string" ? metadata.full_name : undefined),
    avatarUrl:
      profile?.avatar_url ??
      (typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined),
    isPublic: profile?.is_public ?? false,
  };
}

export async function getPublicProfile(username: string) {
  const normalized = githubUsername(username);
  if (!normalized) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileFields)
    .eq("username", normalized)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRecord;
}
