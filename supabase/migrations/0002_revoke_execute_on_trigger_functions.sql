-- These are trigger functions, never meant to be reachable as PostgREST RPCs.
-- Postgres grants EXECUTE to PUBLIC on new functions by default, which exposed
-- them at /rest/v1/rpc/. Triggers fire as the table owner and are unaffected by
-- these revocations.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at()  from public, anon, authenticated;
