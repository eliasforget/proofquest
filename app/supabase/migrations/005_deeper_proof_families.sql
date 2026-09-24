-- ProofQuest Cloud v0.12 — deeper proof families

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
    when 'cicd' then 950
    when 'documentation' then 600
    when 'security' then 1100
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
