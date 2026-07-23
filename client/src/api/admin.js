import { supabase } from "../lib/supabase";

// Retrieves every registered admin profile, newest first.
export async function getAdmins() {
  const { data, error } = await supabase
    .from("admin_profile")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Retrieves one admin profile by its linked Supabase Auth user ID.
export async function getAdmin(id) {
  const { data, error } = await supabase
    .from("admin_profile")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// Updates editable profile fields for a single admin.
export async function updateAdmin(id, data) {
  const { data: updatedAdmin, error } = await supabase
    .from("admin_profile")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updatedAdmin;
}
