begin;

create extension if not exists citext with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated, service_role;

create table public.members (
  id bigint generated always as identity primary key,
  matricule extensions.citext not null unique,
  grade text not null,
  steam_id text unique,
  discord_id text unique,
  presence text,
  reports_count integer not null default 0 check (reports_count >= 0),
  observation text,
  promotion_changed_on date,
  joined_on date,
  sanction text not null default 'Clean',
  recommendation text,
  notes text,
  specializations text[] not null default '{}',
  medals text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_steam_id_format check (steam_id is null or steam_id ~ '^[0-9]{15,22}$'),
  constraint members_discord_id_format check (discord_id is null or discord_id ~ '^[0-9]{15,22}$')
);

create table public.profiles (
  id bigint generated always as identity primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  member_id bigint unique references public.members(id) on delete set null,
  display_name extensions.citext not null unique,
  discord_id text not null unique,
  access_level text not null default 'member'
    check (access_level in ('visitor', 'member', 'officer', 'owner')),
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_discord_id_format check (discord_id ~ '^[0-9]{15,22}$')
);

create index profiles_auth_user_active_idx
  on public.profiles (auth_user_id)
  where active;
create index profiles_member_id_idx on public.profiles (member_id);

create table public.permissions (
  code text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table public.profile_permissions (
  profile_id bigint not null references public.profiles(id) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  granted_by_profile_id bigint references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (profile_id, permission_code)
);

create index profile_permissions_permission_code_idx
  on public.profile_permissions (permission_code);
create index profile_permissions_granted_by_idx
  on public.profile_permissions (granted_by_profile_id);

create table public.gda_roster_versions (
  id bigint generated always as identity primary key,
  published_at timestamptz not null default now(),
  published_by_profile_id bigint references public.profiles(id) on delete set null,
  source_revision bigint,
  note text
);

create index gda_roster_versions_published_at_idx
  on public.gda_roster_versions (published_at desc, id desc);

create table public.gda_roster_members (
  version_id bigint not null references public.gda_roster_versions(id) on delete cascade,
  member_id bigint references public.members(id) on delete set null,
  matricule text not null,
  grade text not null,
  steam_id text,
  discord_id text,
  presence text,
  reports_count integer not null default 0 check (reports_count >= 0),
  observation text,
  promotion_changed_on date,
  joined_on date,
  sanction text not null default 'Clean',
  recommendation text,
  notes text,
  specializations text[] not null default '{}',
  medals text[] not null default '{}',
  primary key (version_id, matricule)
);

create index gda_roster_members_member_id_idx on public.gda_roster_members (member_id);
create index gda_roster_members_discord_id_idx on public.gda_roster_members (discord_id);
create index gda_roster_members_steam_id_idx on public.gda_roster_members (steam_id);

create table public.absences (
  id bigint generated always as identity primary key,
  external_id text unique,
  member_id bigint references public.members(id) on delete set null,
  matricule_snapshot text not null,
  grade_snapshot text not null,
  starts_on date not null,
  ends_on date not null,
  reason text not null,
  active boolean not null default true,
  declared_by_profile_id bigint references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint absences_dates_order check (ends_on >= starts_on)
);

create index absences_member_dates_idx on public.absences (member_id, starts_on desc);
create index absences_active_dates_idx on public.absences (active, ends_on) where active;
create index absences_declared_by_idx on public.absences (declared_by_profile_id);

create table public.absence_requests (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  member_id bigint references public.members(id) on delete set null,
  matricule_snapshot text not null,
  grade_snapshot text not null,
  starts_on date not null,
  ends_on date not null,
  reason text not null,
  status text not null default 'EN_ATTENTE'
    check (status in ('EN_ATTENTE', 'VALIDEE', 'REFUSEE', 'TERMINEE', 'SUPPRIMEE')),
  decided_by_profile_id bigint references public.profiles(id) on delete set null,
  decided_at timestamptz,
  refusal_reason text,
  absence_id bigint references public.absences(id) on delete set null,
  notification_read boolean not null default false,
  notification_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint absence_requests_dates_order check (ends_on >= starts_on)
);

create index absence_requests_member_status_idx
  on public.absence_requests (member_id, status, created_at desc);
create index absence_requests_decided_by_idx on public.absence_requests (decided_by_profile_id);
create index absence_requests_absence_id_idx on public.absence_requests (absence_id);

create table public.departures (
  id bigint generated always as identity primary key,
  external_id text unique,
  member_id bigint references public.members(id) on delete set null,
  matricule_snapshot text not null,
  grade_snapshot text not null,
  steam_id_snapshot text,
  discord_id_snapshot text,
  departure_type text not null,
  starts_on date not null,
  ends_on date,
  reason text,
  status text not null default 'ACTIF',
  decided_by_profile_id bigint references public.profiles(id) on delete set null,
  medals_snapshot text[] not null default '{}',
  medals_restored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departures_dates_order check (ends_on is null or ends_on >= starts_on)
);

create index departures_member_started_idx on public.departures (member_id, starts_on desc);
create index departures_status_idx on public.departures (status, starts_on desc);
create index departures_decided_by_idx on public.departures (decided_by_profile_id);

create table public.reports (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  member_id bigint references public.members(id) on delete set null,
  matricule_snapshot text not null,
  grade_snapshot text not null,
  report_on date not null,
  body text not null,
  comment text,
  conclusion text,
  submitted_at timestamptz not null,
  status text not null default 'EN_ATTENTE'
    check (status in ('EN_ATTENTE', 'LU', 'ARCHIVE')),
  processed_by_profile_id bigint references public.profiles(id) on delete set null,
  processed_at timestamptz,
  source text not null default 'SITE' check (source in ('SITE', 'DISCORD', 'IMPORT')),
  discord_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_member_report_on_idx on public.reports (member_id, report_on desc, id desc);
create index reports_status_submitted_idx on public.reports (status, submitted_at desc, id desc);
create index reports_processed_by_idx on public.reports (processed_by_profile_id);

create table public.report_status_history (
  id bigint generated always as identity primary key,
  report_id bigint not null references public.reports(id) on delete cascade,
  matricule_snapshot text not null,
  grade_snapshot text not null,
  previous_status text,
  new_status text not null,
  changed_by_profile_id bigint references public.profiles(id) on delete set null,
  report_on date,
  created_at timestamptz not null default now()
);

create index report_status_history_report_created_idx
  on public.report_status_history (report_id, created_at desc);
create index report_status_history_changed_by_idx
  on public.report_status_history (changed_by_profile_id);

create table public.personnel_history (
  id bigint generated always as identity primary key,
  member_id bigint references public.members(id) on delete set null,
  matricule_snapshot text not null,
  grade_snapshot text,
  action_type text not null,
  choice text,
  reason text,
  performed_by_profile_id bigint references public.profiles(id) on delete set null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index personnel_history_member_occurred_idx
  on public.personnel_history (member_id, occurred_at desc, id desc);
create index personnel_history_performed_by_idx
  on public.personnel_history (performed_by_profile_id);

create table public.recommendations_observations (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  member_id bigint references public.members(id) on delete set null,
  matricule_snapshot text not null,
  grade_snapshot text,
  entry_type text not null,
  nature text,
  transmitted_by text,
  reason text,
  recorded_by_profile_id bigint references public.profiles(id) on delete set null,
  recorder_grade_snapshot text,
  occurred_on date,
  created_at timestamptz not null default now()
);

create index recommendations_member_created_idx
  on public.recommendations_observations (member_id, created_at desc);
create index recommendations_recorded_by_idx
  on public.recommendations_observations (recorded_by_profile_id);

create table public.instructor_reports (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  created_by_profile_id bigint references public.profiles(id) on delete set null,
  instructor_snapshot text not null,
  report_type text not null check (report_type in ('TEST', 'FORMATION')),
  event_on date not null,
  trainee_name text not null,
  final_matricule text,
  steam_id text,
  discord_id text,
  score numeric(5,2),
  result text,
  remark text,
  comment text,
  folder_external_id text,
  active boolean not null default true,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index instructor_reports_folder_idx on public.instructor_reports (folder_external_id);
create index instructor_reports_creator_submitted_idx
  on public.instructor_reports (created_by_profile_id, submitted_at desc);
create index instructor_reports_active_type_idx
  on public.instructor_reports (active, report_type, submitted_at desc);

create table public.training_followups (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  member_id bigint references public.members(id) on delete set null,
  matricule_snapshot text not null,
  steam_id text,
  discord_id text,
  reports_count integer not null default 0 check (reports_count >= 0),
  service_count integer not null default 0 check (service_count >= 0),
  initial_end_on date,
  end_on date,
  end_after_absence_on date,
  instructor_profile_id bigint references public.profiles(id) on delete set null,
  instructor_snapshot text,
  manager_profile_id bigint references public.profiles(id) on delete set null,
  manager_snapshot text,
  comment text,
  sanction text not null default 'Rien',
  status text not null default 'EN_ATTENTE',
  source text,
  compensated_absence_days integer not null default 0 check (compensated_absence_days >= 0),
  last_manual_freeze_at timestamptz,
  manual_freeze_days integer not null default 0 check (manual_freeze_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_followups_member_status_idx
  on public.training_followups (member_id, status, updated_at desc);
create index training_followups_instructor_idx on public.training_followups (instructor_profile_id);
create index training_followups_manager_idx on public.training_followups (manager_profile_id);

create table public.instructor_archives (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  matricule_snapshot text not null,
  steam_id text,
  discord_id text,
  reports_count integer not null default 0,
  service_count integer not null default 0,
  ended_on date,
  instructor_snapshot text,
  manager_snapshot text,
  comment text,
  sanction text,
  result text,
  reason text,
  imported_at timestamptz,
  source text,
  created_at timestamptz not null default now()
);

create index instructor_archives_matricule_idx on public.instructor_archives (matricule_snapshot);
create index instructor_archives_discord_id_idx on public.instructor_archives (discord_id);
create index instructor_archives_steam_id_idx on public.instructor_archives (steam_id);

create table public.whitelist (
  id bigint generated always as identity primary key,
  external_id text not null unique,
  login_identifier extensions.citext not null unique,
  discord_id text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whitelist_discord_id_format check (discord_id ~ '^[0-9]{15,22}$')
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_profile_id bigint references public.profiles(id) on delete set null,
  actor_name_snapshot text,
  actor_grade_snapshot text,
  action text not null,
  target text,
  details text,
  source text not null default 'SUPABASE',
  occurred_at timestamptz not null default now()
);

create index audit_logs_occurred_idx on public.audit_logs (occurred_at desc, id desc);
create index audit_logs_actor_idx on public.audit_logs (actor_profile_id, occurred_at desc);
create index audit_logs_action_idx on public.audit_logs (action, occurred_at desc);

create table public.notifications (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text,
  related_table text,
  related_id bigint,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_profile_unread_idx
  on public.notifications (profile_id, created_at desc)
  where read_at is null and deleted_at is null;

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by_profile_id bigint references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index app_settings_updated_by_idx on public.app_settings (updated_by_profile_id);

create table public.defcon_state (
  singleton boolean primary key default true check (singleton),
  level smallint not null default 0 check (level between 0 and 5),
  updated_by_profile_id bigint references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.defcon_state (singleton, level) values (true, 0);

insert into public.permissions (code, label) values
  ('effectif_modifier', 'Modifier l’effectif'),
  ('effectif_public_actualiser', 'Forcer l’actualisation de l’effectif public'),
  ('absences_gerer', 'Gérer les absences'),
  ('disponibilites_modifier_supprimer', 'Modifier et supprimer les disponibilités'),
  ('departs_gerer', 'Gérer les départs'),
  ('personnel_historique_modifier', 'Modifier l’historique du personnel'),
  ('personnel_historique_supprimer', 'Supprimer dans l’historique du personnel'),
  ('rapports_gerer', 'Gérer et archiver les rapports'),
  ('rapports_supprimer', 'Supprimer des rapports'),
  ('suivis_decider_tous', 'Décider tous les suivis de formation'),
  ('administration_staff', 'Accéder au menu Administration'),
  ('administration_permissions', 'Modifier les permissions'),
  ('administration_logs', 'Consulter les logs'),
  ('role_visiteur', 'Accès visiteur en lecture'),
  ('role_staff_total', 'Accès administratif complet');

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_set_updated_at before update on public.members
for each row execute function app_private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function app_private.set_updated_at();
create trigger absences_set_updated_at before update on public.absences
for each row execute function app_private.set_updated_at();
create trigger absence_requests_set_updated_at before update on public.absence_requests
for each row execute function app_private.set_updated_at();
create trigger departures_set_updated_at before update on public.departures
for each row execute function app_private.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
for each row execute function app_private.set_updated_at();
create trigger instructor_reports_set_updated_at before update on public.instructor_reports
for each row execute function app_private.set_updated_at();
create trigger training_followups_set_updated_at before update on public.training_followups
for each row execute function app_private.set_updated_at();
create trigger whitelist_set_updated_at before update on public.whitelist
for each row execute function app_private.set_updated_at();

create or replace function app_private.current_profile_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.active
  limit 1
$$;

create or replace function app_private.current_member_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select p.member_id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.active
  limit 1
$$;

create or replace function app_private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = (select auth.uid())
      and p.active
  )
$$;

create or replace function app_private.has_permission(requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = (select auth.uid())
      and p.active
      and (
        p.access_level = 'owner'
        or exists (
          select 1
          from public.profile_permissions pp
          where pp.profile_id = p.id
            and pp.permission_code in (requested_permission, 'role_staff_total')
        )
      )
  )
$$;

revoke all on function app_private.set_updated_at() from public, anon, authenticated;
revoke all on function app_private.current_profile_id() from public, anon;
revoke all on function app_private.current_member_id() from public, anon;
revoke all on function app_private.is_active_user() from public, anon;
revoke all on function app_private.has_permission(text) from public, anon;
grant execute on function app_private.current_profile_id() to authenticated, service_role;
grant execute on function app_private.current_member_id() to authenticated, service_role;
grant execute on function app_private.is_active_user() to authenticated, service_role;
grant execute on function app_private.has_permission(text) to authenticated, service_role;

create view public.current_gda_roster
with (security_invoker = true)
as
select grm.*
from public.gda_roster_members grm
where grm.version_id = (
  select grv.id
  from public.gda_roster_versions grv
  order by grv.published_at desc, grv.id desc
  limit 1
);

create view public.current_officer_roster
with (security_invoker = true)
as
select *
from public.members
where active;

revoke all on schema public from anon;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;

grant usage on schema public to authenticated, service_role;
grant select on public.members,
  public.profiles,
  public.permissions,
  public.profile_permissions,
  public.gda_roster_versions,
  public.gda_roster_members,
  public.current_gda_roster,
  public.current_officer_roster,
  public.absences,
  public.absence_requests,
  public.departures,
  public.reports,
  public.report_status_history,
  public.personnel_history,
  public.recommendations_observations,
  public.instructor_reports,
  public.training_followups,
  public.instructor_archives,
  public.whitelist,
  public.audit_logs,
  public.notifications,
  public.app_settings,
  public.defcon_state
to authenticated;

alter table public.members enable row level security;
alter table public.profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.profile_permissions enable row level security;
alter table public.gda_roster_versions enable row level security;
alter table public.gda_roster_members enable row level security;
alter table public.absences enable row level security;
alter table public.absence_requests enable row level security;
alter table public.departures enable row level security;
alter table public.reports enable row level security;
alter table public.report_status_history enable row level security;
alter table public.personnel_history enable row level security;
alter table public.recommendations_observations enable row level security;
alter table public.instructor_reports enable row level security;
alter table public.training_followups enable row level security;
alter table public.instructor_archives enable row level security;
alter table public.whitelist enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;
alter table public.defcon_state enable row level security;

create policy members_read_active_users on public.members
for select to authenticated using ((select app_private.is_active_user()));
create policy profiles_read_self_or_admin on public.profiles
for select to authenticated using (
  auth_user_id = (select auth.uid())
  or (select app_private.has_permission('administration_permissions'))
);
create policy permissions_read_active_users on public.permissions
for select to authenticated using ((select app_private.is_active_user()));
create policy profile_permissions_read_self_or_admin on public.profile_permissions
for select to authenticated using (
  profile_id = (select app_private.current_profile_id())
  or (select app_private.has_permission('administration_permissions'))
);
create policy roster_versions_read_active_users on public.gda_roster_versions
for select to authenticated using ((select app_private.is_active_user()));
create policy roster_members_read_active_users on public.gda_roster_members
for select to authenticated using ((select app_private.is_active_user()));
create policy absences_read_active_users on public.absences
for select to authenticated using ((select app_private.is_active_user()));
create policy absence_requests_read_owner_or_manager on public.absence_requests
for select to authenticated using (
  member_id = (select app_private.current_member_id())
  or (select app_private.has_permission('absences_gerer'))
);
create policy departures_read_active_users on public.departures
for select to authenticated using ((select app_private.is_active_user()));
create policy reports_read_active_users on public.reports
for select to authenticated using ((select app_private.is_active_user()));
create policy report_history_read_active_users on public.report_status_history
for select to authenticated using ((select app_private.is_active_user()));
create policy personnel_history_read_active_users on public.personnel_history
for select to authenticated using ((select app_private.is_active_user()));
create policy recommendations_read_active_users on public.recommendations_observations
for select to authenticated using ((select app_private.is_active_user()));
create policy instructor_reports_read_active_users on public.instructor_reports
for select to authenticated using ((select app_private.is_active_user()));
create policy training_followups_read_active_users on public.training_followups
for select to authenticated using ((select app_private.is_active_user()));
create policy instructor_archives_read_active_users on public.instructor_archives
for select to authenticated using ((select app_private.is_active_user()));
create policy whitelist_read_admins on public.whitelist
for select to authenticated using ((select app_private.has_permission('administration_permissions')));
create policy audit_logs_read_admins on public.audit_logs
for select to authenticated using ((select app_private.has_permission('administration_logs')));
create policy notifications_read_owner on public.notifications
for select to authenticated using (profile_id = (select app_private.current_profile_id()));
create policy settings_read_admins on public.app_settings
for select to authenticated using ((select app_private.has_permission('administration_permissions')));
create policy defcon_read_active_users on public.defcon_state
for select to authenticated using ((select app_private.is_active_user()));

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

commit;
