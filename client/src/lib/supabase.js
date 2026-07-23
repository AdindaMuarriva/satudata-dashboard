import { createClient } from "@supabase/supabase-js";

// Shared Supabase client for browser-side authentication and database access.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
