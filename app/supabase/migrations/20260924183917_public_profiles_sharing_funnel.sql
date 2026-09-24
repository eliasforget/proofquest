-- v0.13: presentation fields and bounded, observational funnel milestones.
alter table public.profiles
  add column headline text not null default '',
  add column public_links text[] not null default '{}';

create function public.valid_profile_links(links text[])
returns boolean language sql immutable security invoker set search_path = ''
as $$
  select coalesce(array_ndims(links), 1) = 1
    and cardinality(links) <= 3
    and not exists (
      select 1 from unnest(links) link
      where link is null or length(link) > 300
        or link !~ '^https://[A-Za-z0-9.-]+\.[A-Za-z0-9-]+(:[0-9]+)?([/?#][^[:space:]\\]*)?$'
        or link ~ '[[:space:]\\]'
    );
$$;
revoke all on function public.valid_profile_links(text[]) from public;
grant execute on function public.valid_profile_links(text[]) to anon, authenticated, service_role;

alter table public.profiles
  add constraint profiles_headline_length check (length(headline) <= 80),
  add constraint profiles_bio_length check (bio is null or length(bio) <= 500),
  add constraint profiles_public_links_valid check (public.valid_profile_links(public_links));
grant update (headline, public_links) on public.profiles to authenticated;
-- Existing SELECT and UPDATE-own policies and immutable identity grants remain.

create table public.funnel_events (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  event text not null check (event in ('login', 'scan', 'quest_start', 'quest_verified', 'proof_share')),
  event_day date not null default ((now() at time zone 'UTC')::date),
  created_at timestamptz not null default now(),
  primary key (user_id, event_day, event)
);
alter table public.funnel_events enable row level security;
revoke all on public.funnel_events from public, anon, authenticated;
grant insert (user_id, event) on public.funnel_events to authenticated;
grant all on public.funnel_events to service_role;
create policy funnel_insert_own on public.funnel_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
create index funnel_events_day_event_idx on public.funnel_events(event_day, event);
comment on table public.funnel_events is
  'Untrusted product milestones, at most five per account per UTC day. Never an XP or verification source. No visitor tracking; delete rows older than 90 days in maintenance.';
