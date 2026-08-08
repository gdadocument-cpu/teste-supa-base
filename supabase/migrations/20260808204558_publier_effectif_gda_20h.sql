create extension if not exists pg_cron;

create or replace function app_private.publish_gda_roster_snapshot(
  p_note text,
  p_published_by_profile_id bigint default null
)
returns bigint
language plpgsql
set search_path = ''
as $function$
declare
  v_version_id bigint;
begin
  insert into public.gda_roster_versions (
    published_by_profile_id,
    note
  )
  values (
    p_published_by_profile_id,
    coalesce(nullif(btrim(p_note), ''), 'Actualisation de l’effectif GDA')
  )
  returning id into v_version_id;

  insert into public.gda_roster_members (
    version_id,
    member_id,
    matricule,
    grade,
    steam_id,
    discord_id,
    presence,
    reports_count,
    observation,
    promotion_changed_on,
    joined_on,
    sanction,
    recommendation,
    notes,
    specializations,
    medals
  )
  select
    v_version_id,
    membre.id,
    membre.matricule,
    membre.grade,
    membre.steam_id,
    membre.discord_id,
    membre.presence,
    membre.reports_count,
    membre.observation,
    membre.promotion_changed_on,
    membre.joined_on,
    coalesce(nullif(membre.sanction, ''), 'Clean'),
    membre.recommendation,
    membre.notes,
    coalesce(membre.specializations, '{}'::text[]),
    coalesce(membre.medals, '{}'::text[])
  from public.members as membre
  where membre.active = true;

  return v_version_id;
end;
$function$;

create or replace function app_private.publish_gda_roster_20h()
returns bigint
language plpgsql
set search_path = ''
as $function$
declare
  v_maintenant timestamptz := clock_timestamp();
  v_maintenant_paris timestamp := timezone('Europe/Paris', v_maintenant);
  v_version_id bigint;
begin
  -- Le job est lancé à 18 h et 19 h UTC. Une seule de ces deux heures
  -- correspond à 20 h à Paris selon la période été/hiver.
  if extract(hour from v_maintenant_paris) <> 20 then
    return null;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('gda_roster_daily_20h_europe_paris', 0)
  );

  select version.id
  into v_version_id
  from public.gda_roster_versions as version
  where timezone('Europe/Paris', version.published_at)::date = v_maintenant_paris::date
    and timezone('Europe/Paris', version.published_at)::time >= time '20:00:00'
  order by version.published_at desc, version.id desc
  limit 1;

  if v_version_id is not null then
    return v_version_id;
  end if;

  return app_private.publish_gda_roster_snapshot(
    'Actualisation automatique quotidienne à 20 h',
    null
  );
end;
$function$;

revoke all on function app_private.publish_gda_roster_snapshot(text, bigint)
  from public, anon, authenticated, service_role;
revoke all on function app_private.publish_gda_roster_20h()
  from public, anon, authenticated, service_role;

do $block$
declare
  v_job_id bigint;
begin
  select jobid
  into v_job_id
  from cron.job
  where jobname = 'publier-effectif-gda-20h-paris';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$block$;

select cron.schedule(
  'publier-effectif-gda-20h-paris',
  '0 18,19 * * *',
  $cron$select app_private.publish_gda_roster_20h();$cron$
);
