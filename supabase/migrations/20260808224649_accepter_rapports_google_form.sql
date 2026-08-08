alter table public.reports
  drop constraint if exists reports_source_check;

alter table public.reports
  add constraint reports_source_check
  check (source = any (array['SITE', 'DISCORD', 'GOOGLE_FORM', 'IMPORT']));

insert into public.app_settings (key, value)
values (
  'google_form_reports_webhook',
  '{"sha256":"4e713c7b7ce8b99f5bd8356cacf28a2422c80feddda9a7b23b30821effcf3f09"}'::jsonb
)
on conflict (key) do update
set value = excluded.value,
    updated_by_profile_id = null,
    updated_at = now();
