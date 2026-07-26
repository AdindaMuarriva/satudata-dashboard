import { supabase } from "../lib/supabase";
import { createActivityLog } from "./activity";

export async function deleteMyAccount() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Belum login.");
  }

  await createActivityLog(
    "Hapus Akun",
    "Admin menghapus akun miliknya."
  ).catch(() => {});

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-admin-account`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Gagal menghapus akun.");
  }

  await supabase.auth.signOut();

  return result;
}

// Verifies the current admin code before replacing it with a new one.
export async function updateAdminCode(currentCode, newCode) {
  const { data: settings, error: settingsError } = await supabase
    .from("admin_settings")
    .select("admin_code")
    .eq("id", 1)
    .single();

  if (settingsError) throw new Error("Tidak dapat memverifikasi kode admin saat ini.");

  if (currentCode !== settings.admin_code) {
    throw new Error("Kode Admin lama tidak valid.");
  }

  const { error: updateError } = await supabase
    .from("admin_settings")
    .update({ admin_code: newCode })
    .eq("id", 1);

  if (updateError) throw new Error("Kode Admin baru gagal disimpan.");

  // Log aktivitas setelah kode admin berhasil diperbarui
  await createActivityLog("Ubah Kode Admin", "Admin berhasil memperbarui kode admin.").catch(() => {});
}

// Updates the password for the current admin user.
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  // Log aktivitas setelah password berhasil diubah
  await createActivityLog("Ubah Password", "Admin berhasil mengubah password akun.").catch(() => {});
}
