import { supabase } from "../lib/supabase.js";

// Status ini berada di Supabase, bukan di localStorage
export async function getDatasetVisibility() {
  try {
    const { data, error } = await supabase
      .from("dataset_visibility")
      .select("dataset_uuid, is_active, deleted_at, permanently_deleted");

    if (error) throw error;
    return new Map((data || []).map((item) => [item.dataset_uuid, item]));
  } catch (error) {
    console.warn("Status visibilitas dataset belum dapat dimuat:", error.message);
    return new Map();
  }
}

export async function saveDatasetVisibility(datasetUuid, changes) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Sesi admin tidak ditemukan.");

  const { error } = await supabase.from("dataset_visibility").upsert(
    {
      dataset_uuid: String(datasetUuid),
      updated_by: user.id,
      ...changes,
    },
    { onConflict: "dataset_uuid" }
  );

  if (error) throw error;
}
