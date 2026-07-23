import { supabase } from "../lib/supabase";

/**
 * Mengambil daftar aktivitas admin yang sedang login.
 * RLS Supabase akan otomatis memfilter sehingga hanya
 * aktivitas milik admin tersebut yang dikembalikan.
 */
export async function getActivityLogs(limit = 50) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

/**
 * Menambahkan log aktivitas admin.
 * Logging bersifat best-effort sehingga apabila gagal
 * tidak akan mengganggu proses utama aplikasi.
 */
export async function createActivityLog(activity, description = "") {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        admin_id: user.id,
        admin_name:
          user.user_metadata?.full_name ||
          user.email ||
          "Administrator",
        activity,
        description,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("Activity Log Error:", err.message);
    return null;
  }
}