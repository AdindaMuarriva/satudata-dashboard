import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Dashboard publik tidak boleh blank hanya karena fitur admin belum dikonfigurasi.
// Client pengganti ini membuat halaman publik tetap berjalan dan memberi pesan yang
// jelas bila seseorang membuka login admin tanpa konfigurasi Supabase.
function unavailableClient() {
  const error = { message: "Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di client/.env." };
  const failed = async () => ({ data: null, error });
  const query = { insert: () => query, select: () => query, order: () => query, limit: () => query, single: failed, then: (resolve) => resolve({ data: null, error }) };
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: failed,
      signUp: failed,
      signOut: failed,
      getUser: async () => ({ data: { user: null }, error })
    },
    from: () => query
  };
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : unavailableClient();
