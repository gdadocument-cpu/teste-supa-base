alter table public.reports
  add column if not exists refusal_reason text,
  add column if not exists rejected_at timestamp with time zone,
  add column if not exists resubmitted_at timestamp with time zone;

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status = any (array['EN_ATTENTE'::text, 'LU'::text, 'REFUSE'::text, 'ARCHIVE'::text]));

alter table public.reports drop constraint if exists reports_refusal_reason_check;
alter table public.reports
  add constraint reports_refusal_reason_check
  check (status <> 'REFUSE' or nullif(btrim(refusal_reason), '') is not null);

create index if not exists notifications_profile_active_idx
  on public.notifications (profile_id, created_at desc)
  where deleted_at is null;

delete from public.reports
where source = 'IMPORT';
