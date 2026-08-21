import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env.local and fill both in from the Supabase dashboard.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * This app's tables live in the `altracker` schema; `public` holds the identity
 * records shared with any other app in this project.
 *
 * Requires `altracker` to be listed under Settings -> API -> Exposed schemas,
 * otherwise PostgREST returns PGRST106 for every query here.
 */
export const alt = () => supabase.schema('altracker');
