import { useConnectionTest } from "../../hooks/useConnectionTest";

function statusLabel(status: ReturnType<typeof useConnectionTest>["status"]): string {
  switch (status) {
    case "loading":
      return "Checking…";
    case "ok":
      return "Connected";
    case "error":
      return "Error";
    default:
      return "Not checked yet";
  }
}

export function SupabaseConnectionTest() {
  const { status, errorMessage, rows, refresh, addRow } = useConnectionTest();

  return (
    <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/20 px-4 py-4">
      <p className="text-sm font-medium text-emerald-100">Supabase connection test</p>
      <p className="mt-1 text-xs text-neutral-400">
        Dev-only table <code className="text-neutral-300">connection_test</code>. Run the
        SQL in <code className="text-neutral-300">supabase/migrations/</code> once in the
        Supabase SQL Editor if you have not already.
      </p>

      <p className="mt-3 text-xs text-neutral-300">
        Status: <span className="font-medium text-white">{statusLabel(status)}</span>
      </p>

      {errorMessage ? (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={status === "loading"}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Read rows
        </button>
        <button
          type="button"
          onClick={() => void addRow()}
          disabled={status === "loading"}
          className="rounded-lg border border-neutral-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Insert test row
        </button>
      </div>

      {rows.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-neutral-400">
          {rows.map((row) => (
            <li key={row.id}>
              <span className="text-neutral-200">#{row.id}</span> {row.message}
            </li>
          ))}
        </ul>
      ) : status === "ok" ? (
        <p className="mt-2 text-xs text-neutral-500">Table is empty — try Insert test row.</p>
      ) : null}
    </div>
  );
}
