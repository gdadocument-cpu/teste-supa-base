alter table public.navigation_links
  add column icon text not null default '🔗'
  check (char_length(btrim(icon)) between 1 and 16);

update public.navigation_links
set icon = case
  when category = 'INSTRUCTEUR' then '🎓'
  when lower(label) like '%règlement%' or lower(label) like '%reglement%' then '📜'
  when lower(label) like '%guide%' then '📘'
  when lower(label) like '%martial%' then '⚖️'
  else '🔗'
end;
