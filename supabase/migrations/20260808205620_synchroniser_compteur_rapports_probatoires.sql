create index if not exists reports_member_submitted_idx
  on public.reports (member_id, submitted_at);

create index if not exists reports_matricule_submitted_idx
  on public.reports ((lower(btrim(matricule_snapshot))), submitted_at);

create or replace function app_private.sync_training_followup_report_counts()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  updated_rows integer := 0;
begin
  with calculated_counts as (
    select
      followup.id,
      (
        select count(*)::integer
        from public.reports as report
        where report.submitted_at >= coalesce(
          ((followup.initial_end_on - 7)::timestamp at time zone 'Europe/Paris'),
          followup.created_at
        )
          and (
            (followup.member_id is not null and report.member_id = followup.member_id)
            or (
              (followup.member_id is null or report.member_id is null)
              and lower(btrim(report.matricule_snapshot)) = lower(btrim(followup.matricule_snapshot))
            )
          )
      ) as reports_count
    from public.training_followups as followup
    where followup.status = 'EN_ATTENTE'
  )
  update public.training_followups as followup
  set reports_count = calculated.reports_count
  from calculated_counts as calculated
  where followup.id = calculated.id
    and followup.reports_count is distinct from calculated.reports_count;

  get diagnostics updated_rows = row_count;
  return updated_rows;
end;
$$;

create or replace function app_private.sync_training_followup_report_counts_trigger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform app_private.sync_training_followup_report_counts();
  return null;
end;
$$;

drop trigger if exists sync_training_followup_reports_after_insert_delete on public.reports;
create trigger sync_training_followup_reports_after_insert_delete
after insert or delete on public.reports
for each statement
execute function app_private.sync_training_followup_report_counts_trigger();

drop trigger if exists sync_training_followup_reports_after_identity_update on public.reports;
create trigger sync_training_followup_reports_after_identity_update
after update of member_id, matricule_snapshot, submitted_at on public.reports
for each statement
execute function app_private.sync_training_followup_report_counts_trigger();

drop trigger if exists sync_training_followup_reports_after_followup_change on public.training_followups;
create trigger sync_training_followup_reports_after_followup_change
after insert or update of member_id, matricule_snapshot, initial_end_on, end_on, status on public.training_followups
for each statement
execute function app_private.sync_training_followup_report_counts_trigger();

revoke all on function app_private.sync_training_followup_report_counts() from public, anon, authenticated;
revoke all on function app_private.sync_training_followup_report_counts_trigger() from public, anon, authenticated;
grant execute on function app_private.sync_training_followup_report_counts() to service_role;
grant execute on function app_private.sync_training_followup_report_counts_trigger() to service_role;

select app_private.sync_training_followup_report_counts();
