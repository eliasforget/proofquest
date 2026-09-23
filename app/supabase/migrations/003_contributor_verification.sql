-- ProofQuest Cloud v0.10 — contributor-bound quest verification

alter table public.profiles
  add column if not exists github_user_id bigint;

update public.profiles p
set github_user_id = nullif(coalesce(
  u.raw_user_meta_data ->> 'provider_id',
  u.raw_user_meta_data ->> 'sub'
), '')::bigint
from auth.users u
where u.id = p.user_id
  and p.github_user_id is null
  and coalesce(
    u.raw_user_meta_data ->> 'provider_id',
    u.raw_user_meta_data ->> 'sub'
  ) ~ '^[0-9]+$';

create unique index if not exists profiles_github_user_id_unique
  on public.profiles(github_user_id)
  where github_user_id is not null;

alter table public.quest_history
  add column if not exists verified_commit_sha text,
  add column if not exists verified_github_user_id bigint,
  add column if not exists verification_method text,
  add column if not exists verification_metadata jsonb not null default '{}'::jsonb,
  add column if not exists verified_at timestamptz;

revoke insert, update, delete on public.active_quests from authenticated;
grant select on public.active_quests to authenticated;

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
  github_id_value bigint;
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

  if coalesce(
    new.raw_user_meta_data ->> 'provider_id',
    new.raw_user_meta_data ->> 'sub'
  ) ~ '^[0-9]+$' then
    github_id_value := coalesce(
      new.raw_user_meta_data ->> 'provider_id',
      new.raw_user_meta_data ->> 'sub'
    )::bigint;
  end if;

  begin
    insert into public.profiles(
      user_id, username, display_name, avatar_url, github_user_id
    )
    values (
      new.id, candidate, display_value, avatar_value, github_id_value
    )
    on conflict (user_id) do update
      set github_user_id = coalesce(
        public.profiles.github_user_id,
        excluded.github_user_id
      );
  exception when unique_violation then
    insert into public.profiles(
      user_id, username, display_name, avatar_url, github_user_id
    )
    values (
      new.id,
      left(candidate, 28) || '-' || left(new.id::text, 8),
      display_value,
      avatar_value,
      github_id_value
    )
    on conflict (user_id) do update
      set github_user_id = coalesce(
        public.profiles.github_user_id,
        excluded.github_user_id
      );
  end;

  insert into public.player_progress(user_id, total_xp)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_proofquest_user()
from public, anon, authenticated;

create or replace function public.award_verified_quest_v2(
  p_user_id uuid,
  p_repository_full_name text,
  p_kind text,
  p_verified_commit_sha text,
  p_verified_github_user_id bigint,
  p_verification_method text,
  p_verification_metadata jsonb default '{}'::jsonb
)
returns table (
  awarded boolean,
  xp_reward integer,
  total_xp integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp integer;
  v_inserted integer := 0;
  v_total integer := 0;
  v_quest_id text;
  v_started_at timestamptz;
begin
  if p_user_id is null then
    raise exception 'missing user';
  end if;

  if p_repository_full_name !~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' then
    raise exception 'invalid repository';
  end if;

  if p_verified_commit_sha !~ '^[0-9a-fA-F]{40,64}$' then
    raise exception 'invalid verification commit';
  end if;

  if p_verified_github_user_id is null or p_verified_github_user_id <= 0 then
    raise exception 'invalid github user';
  end if;

  if p_verification_method <> 'github_commit_after_start' then
    raise exception 'invalid verification method';
  end if;

  v_xp := case p_kind
    when 'testing' then 850
    when 'docker' then 900
    when 'kubernetes' then 1250
    when 'hardening' then 700
    else null
  end;

  if v_xp is null then
    raise exception 'unsupported quest kind';
  end if;

  select aq.started_at
    into v_started_at
  from public.active_quests aq
  where aq.user_id = p_user_id
    and lower(aq.repository_full_name) = lower(p_repository_full_name)
    and aq.kind = p_kind
  for update;

  if v_started_at is null then
    raise exception 'quest is not active';
  end if;

  v_quest_id := p_kind || ':' || lower(p_repository_full_name);

  insert into public.quest_history(
    user_id,
    id,
    repository_full_name,
    kind,
    xp_reward,
    started_at,
    completed_at,
    verified_commit_sha,
    verified_github_user_id,
    verification_method,
    verification_metadata,
    verified_at
  )
  values (
    p_user_id,
    v_quest_id,
    p_repository_full_name,
    p_kind,
    v_xp,
    v_started_at,
    now(),
    lower(p_verified_commit_sha),
    p_verified_github_user_id,
    p_verification_method,
    coalesce(p_verification_metadata, '{}'::jsonb),
    now()
  )
  on conflict (user_id, repository_full_name, kind) do nothing;

  get diagnostics v_inserted = row_count;

  insert into public.player_progress(user_id, total_xp)
  values (p_user_id, case when v_inserted = 1 then v_xp else 0 end)
  on conflict (user_id) do update
    set total_xp = public.player_progress.total_xp +
      case when v_inserted = 1 then v_xp else 0 end;

  delete from public.active_quests
  where user_id = p_user_id
    and lower(repository_full_name) = lower(p_repository_full_name)
    and kind = p_kind;

  select pp.total_xp into v_total
  from public.player_progress pp
  where pp.user_id = p_user_id;

  return query
  select (v_inserted = 1), v_xp, coalesce(v_total, 0);
end;
$$;

revoke all on function public.award_verified_quest_v2(
  uuid, text, text, text, bigint, text, jsonb
) from public, anon, authenticated;

grant execute on function public.award_verified_quest_v2(
  uuid, text, text, text, bigint, text, jsonb
) to service_role;
