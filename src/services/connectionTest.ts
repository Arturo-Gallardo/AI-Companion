import { supabase } from "../lib/supabase";
import type { ConnectionTestRow } from "../types/connectionTest";

export async function fetchConnectionTestRows(): Promise<ConnectionTestRow[]> {
  const { data, error } = await supabase
    .from("connection_test")
    .select("id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function insertConnectionTestRow(message: string): Promise<void> {
  const { error } = await supabase.from("connection_test").insert({ message });

  if (error) {
    throw error;
  }
}
