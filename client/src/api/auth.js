import { supabase } from "./supabase";

// Mendaftarkan pengguna baru menggunakan email dan kata sandi melalui Supabase Auth.
export function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

// Memulai sesi pengguna menggunakan email dan kata sandi melalui Supabase Auth.
export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

// Mengakhiri sesi pengguna Supabase yang sedang aktif di browser ini.
export function signOut() {
  return supabase.auth.signOut();
}

// Mengambil pengguna Supabase yang saat ini terautentikasi, bila ada.
export function getCurrentUser() {
  return supabase.auth.getUser();
}
