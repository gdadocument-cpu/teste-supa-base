insert into public.permissions (code, label)
values ('departs_medailles_gerer', 'Gérer les médailles des départs')
on conflict (code) do update
set label = excluded.label;
