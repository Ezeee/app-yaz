import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes("tu_") &&
  !supabaseKey.includes("tu_");

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = !!supabase;
