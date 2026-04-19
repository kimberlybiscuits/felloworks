// Supabase client initialisation
// Two clients:
//   - supabase: uses the anon key — safe for operations that respect Row Level Security (RLS)
//   - supabaseAdmin: uses the service role key — bypasses RLS, for server-side-only operations
//     (e.g. creating users, reading invites during signup). Never expose this key to the frontend.

const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase credentials. Check your .env file against .env.example."
  );
}

// Standard client — respects RLS policies
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client — service role, bypasses RLS. Use only server-side.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase, supabaseAdmin };
