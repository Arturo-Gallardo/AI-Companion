import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function requireEnv(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`Missing ${name} — add it to .env.local and restart the dev server.`);
  }
  return value;
}

export const supabase: SupabaseClient = createClient(
  requireEnv(url, "VITE_SUPABASE_URL"),
  requireEnv(publishableKey, "VITE_SUPABASE_PUBLISHABLE_KEY"),
);
