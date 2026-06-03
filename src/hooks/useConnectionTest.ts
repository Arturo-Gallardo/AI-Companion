import { useCallback, useState } from "react";
import {
  fetchConnectionTestRows,
  insertConnectionTestRow,
} from "../services/connectionTest";
import type { ConnectionTestRow } from "../types/connectionTest";

type ConnectionTestStatus = "idle" | "loading" | "ok" | "error";

function formatSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong talking to Supabase.";
}

export function useConnectionTest() {
  const [status, setStatus] = useState<ConnectionTestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rows, setRows] = useState<ConnectionTestRow[]>([]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const nextRows = await fetchConnectionTestRows();
      setRows(nextRows);
      setStatus("ok");
    } catch (error) {
      setStatus("error");
      setErrorMessage(formatSupabaseError(error));
    }
  }, []);

  const addRow = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    const message = `Tomoji ping @ ${new Date().toLocaleString()}`;

    try {
      await insertConnectionTestRow(message);
      const nextRows = await fetchConnectionTestRows();
      setRows(nextRows);
      setStatus("ok");
    } catch (error) {
      setStatus("error");
      setErrorMessage(formatSupabaseError(error));
    }
  }, []);

  return {
    status,
    errorMessage,
    rows,
    refresh,
    addRow,
  };
}
