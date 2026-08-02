create table public.online_presence (
  profile_id bigint primary key references public.profiles(id) on delete cascade,
  member_id bigint references public.members(id) on delete set null,
  name_snapshot text not null,
  grade_snapshot text not null,
  last_seen_at timestamptz not null default now()
);

create index online_presence_last_seen_idx
  on public.online_presence (last_seen_at desc);

alter table public.online_presence enable row level security;

revoke all on table public.online_presence from anon, authenticated;
grant all on table public.online_presence to service_role;
