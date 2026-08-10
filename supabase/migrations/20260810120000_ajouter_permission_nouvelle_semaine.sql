insert into public.permissions (code, label)
values (
  'recommandations_nouvelle_semaine',
  'Commencer une nouvelle semaine (recommandations et observations)'
)
on conflict (code) do update
set label = excluded.label;
