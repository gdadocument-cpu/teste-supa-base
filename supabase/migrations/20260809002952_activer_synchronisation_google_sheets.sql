create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'synchroniser-google-sheets-gda',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := 'https://hiothrwlpmulpcwwjxqf.supabase.co/functions/v1/sync-google-sheets',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'google_sheets_sync_invocation_key'
        ),
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'google_sheets_sync_invocation_key'
        )
      ),
      body := jsonb_build_object(
        'source', 'cron',
        'requested_at', now()
      ),
      timeout_milliseconds := 120000
    );
  $job$
);
