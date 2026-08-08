alter table public.absences
  add column if not exists declared_by_snapshot text;

alter table public.absence_requests
  add column if not exists decided_by_snapshot text;

alter table public.departures
  add column if not exists decided_by_snapshot text;

alter table public.reports
  add column if not exists processed_by_snapshot text;

alter table public.report_status_history
  add column if not exists changed_by_snapshot text;

alter table public.personnel_history
  add column if not exists performed_by_snapshot text;

alter table public.recommendations_observations
  add column if not exists recorded_by_snapshot text;
