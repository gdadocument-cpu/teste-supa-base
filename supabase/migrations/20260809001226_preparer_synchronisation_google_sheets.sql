create or replace function public.google_sheets_sync_config()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('role', true), ''),
    ''
  );
  destination_url text;
  shared_secret text;
begin
  if jwt_role <> 'service_role' then
    raise exception 'Accès réservé au service de synchronisation.'
      using errcode = '42501';
  end if;

  select decrypted_secret
    into destination_url
  from vault.decrypted_secrets
  where name = 'google_sheets_sync_url'
  limit 1;

  select decrypted_secret
    into shared_secret
  from vault.decrypted_secrets
  where name = 'google_sheets_sync_shared_secret'
  limit 1;

  return jsonb_build_object(
    'url', coalesce(destination_url, ''),
    'secret', coalesce(shared_secret, '')
  );
end;
$$;

revoke all on function public.google_sheets_sync_config() from public, anon, authenticated;
grant execute on function public.google_sheets_sync_config() to service_role;

comment on function public.google_sheets_sync_config() is
  'Retourne au seul rôle service_role la destination Apps Script stockée dans Vault.';
