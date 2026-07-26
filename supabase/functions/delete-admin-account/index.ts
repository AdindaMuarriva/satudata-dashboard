import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // Ini adalah nama environment variable bawaan Supabase Edge Functions.
    // SERVICE_ROLE_KEY tidak tersedia secara otomatis sehingga fungsi selalu
    // gagal sebelum proses penghapusan dijalankan.
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Konfigurasi Supabase Edge Function belum lengkap.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "User tidak ditemukan." }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Hapus activity log
    const { error: activityError } = await supabase
      .from("activity_logs")
      .delete()
      .eq("admin_id", user.id);

    if (activityError) {
      throw new Error(`Gagal menghapus riwayat aktivitas: ${activityError.message}`);
    }

    // Hapus profil admin
    const { error: profileError } = await supabase
      .from("admin_profile")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      throw new Error(`Gagal menghapus profil admin: ${profileError.message}`);
    }

    // Hapus akun Authentication
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
