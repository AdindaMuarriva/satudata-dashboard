import { createClient } from "@supabase/supabase-js";

// URL project Supabase disediakan melalui environment variable Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Anon key aman digunakan di browser dan juga disediakan oleh Vite.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Satu instance klien bersama untuk seluruh modul API aplikasi.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
