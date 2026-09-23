-- ProofQuest Cloud v0.8
-- Idempotent baseline matching the production Supabase project.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$'),
  display_name text,
  avatar_url text,
  bio text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_progress (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_history (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  id text not null,
  repository_full_name text not null,
  kind text not null check (kind in ('testing','docker','cicd','documentation','security','kubernetes','hardening')),
  xp_reward integer not null check (xp_reward >= 0 and xp_reward <= 100000),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  primary key (user_id, id),
  unique (user_id, repository_full_name, kind)
);

create table if not exists public.active_quests (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  repository_full_name text not null,
  id text not null,
  kind text not null check (kind in ('testing','docker','cicd','documentation','security','kubernetes','hardening')),
  xp_reward integer not null check (xp_reward >= 0 and xp_reward <= 100000),
  target_skill_key text not null,
  started_at timestamptz not null,
  baseline_completed_objective_ids jsonb not null default '[]'::jsonb,
  objective_count integer not null check (objective_count >= 0 and objective_count <= 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, repository_full_name)
);

create table if not exists public.repository_scans (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  repository_full_name text not null,
  analyzed_at timestamptz not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, repository_full_name, analyzed_at)
);

create index if not exists quest_history_user_completed_idx
  on public.quest_history(user_id, completed_at desc);

create index if not exists repository_scans_user_repo_idx
  on public.repository_scans(user_id, repository_full_name, analyzed_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists progress_touch_updated_at on public.player_progress;
create trigger progress_touch_updated_at
before update on public.player_progress
for each row execute function public.touch_updated_at();

drop trigger if exists active_quests_touch_updated_at on public.active_quests;
create trigger active_quests_touch_updated_at
before update on public.active_quests
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_proofquest_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text;
  candidate text;
  display_value text;
  avatar_value text;
begin
  raw_name := lower(coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(coalesce(new.email, ''), '@', 1),
    'dev'
  ));

  candidate := regexp_replace(raw_name, '[^a-z0-9-]', '-', 'g');
  candidate := regexp_replace(candidate, '^-+|-+$', '', 'g');
  candidate := left(candidate, 39);

  if candidate = '' or candidate !~ '^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$' then
    candidate := 'dev-' || left(new.id::text, 8);
  end if;

  display_value := left(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    candidate
  ), 80);
  avatar_value := new.raw_user_meta_data ->> 'avatar_url';

  begin
    insert into public.profiles(user_id, username, display_name, avatar_url)
    values (new.id, candidate, display_value, avatar_value)
    on conflict (user_id) do nothing;
  exception when unique_violation then
    insert into public.profiles(user_id, username, display_name, avatar_url)
    values (new.id, left(candidate, 28) || '-' || left(new.id::text, 8), display_value, avatar_value)
    on conflict (user_id) do nothing;
  end;

  insert into public.player_progress(user_id, total_xp)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_proofquest_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_proofquest on auth.users;
create trigger on_auth_user_created_proofquest
after insert on auth.users
for each row execute function public.handle_new_proofquest_user();

alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.quest_history enable row level security;
alter table public.active_quests enable row level security;
alter table public.repository_scans enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
to anon, authenticated
using (is_public or (select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert
to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "progress_select" on public.player_progress;
create policy "progress_select" on public.player_progress for select
to anon, authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.user_id = player_progress.user_id and p.is_public
  )
);

drop policy if exists "quest_history_select" on public.quest_history;
create policy "quest_history_select" on public.quest_history for select
to anon, authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.user_id = quest_history.user_id and p.is_public
  )
);

drop policy if exists "active_quests_own" on public.active_quests;
create policy "active_quests_own" on public.active_quests for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "repository_scans_own" on public.repository_scans;
create policy "repository_scans_own" on public.repository_scans for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.profiles, public.player_progress, public.quest_history,
  public.active_quests, public.repository_scans from anon, authenticated;

grant select on public.profiles, public.player_progress, public.quest_history
  to anon, authenticated;

grant insert on public.profiles to authenticated;
grant update (display_name, avatar_url, bio, is_public) on public.profiles to authenticated;

grant all on public.profiles, public.player_progress, public.quest_history,
  public.active_quests, public.repository_scans to service_role;

grant usage, select on sequence public.repository_scans_id_seq to service_role;
