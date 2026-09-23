-- ProofQuest Cloud v0.9 — verified progression

grant select, insert, update, delete
on public.active_quests, public.repository_scans
to authenticated;

create or replace function public.award_verified_quest(
  p_user_id uuid,
  p_repository_full_name text,
  p_kind text
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
begin
  if p_user_id is null then
    raise exception 'missing user';
  end if;

  if p_repository_full_name !~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' then
    raise exception 'invalid repository';
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

  v_quest_id := p_kind || ':' || lower(p_repository_full_name);

  insert into public.quest_history(
    user_id,
    id,
    repository_full_name,
    kind,
    xp_reward,
    started_at,
    completed_at
  )
  values (
    p_user_id,
    v_quest_id,
    p_repository_full_name,
    p_kind,
    v_xp,
    now(),
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
    and repository_full_name = p_repository_full_name;

  select pp.total_xp into v_total
  from public.player_progress pp
  where pp.user_id = p_user_id;

  return query
  select (v_inserted = 1), v_xp, coalesce(v_total, 0);
end;
$$;

revoke all on function public.award_verified_quest(uuid, text, text)
from public, anon, authenticated;

grant execute on function public.award_verified_quest(uuid, text, text)
to service_role;
