import { supabase } from "./supabase";

// Memeriksa apakah Supabase Auth dapat diakses dengan mencoba membaca sesi saat ini.
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
