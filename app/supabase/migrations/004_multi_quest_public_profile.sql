-- ProofQuest Cloud v0.11 — multi-quest deck + public proof profile

alter table public.active_quests
  drop constraint if exists active_quests_pkey;

alter table public.active_quests
  add constraint active_quests_pkey
  primary key (user_id, repository_full_name, kind);

create index if not exists active_quests_user_started_idx
  on public.active_quests(user_id, started_at desc);

drop policy if exists "repository_scans_public_select"
  on public.repository_scans;

create policy "repository_scans_public_select"
on public.repository_scans
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = repository_scans.user_id
      and p.is_public
  )
);

grant select on public.repository_scans to anon, authenticated;
