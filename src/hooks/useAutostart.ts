import {
  disable,
  enable,
  isEnabled,
} from "@tauri-apps/plugin-autostart";
import { useCallback, useEffect, useState } from "react";

interface UseAutostartResult {
  isAutostartEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  setAutostartEnabled: (enabled: boolean) => Promise<void>;
}

export function useAutostart(): UseAutostartResult {
  const [isAutostartEnabled, setIsAutostartEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void isEnabled()
      .then((enabled) => {
        if (!cancelled) {
          setIsAutostartEnabled(enabled);
        }
      })
      .catch((cause: unknown) => {
        console.error("failed to read autostart setting", cause);
        if (!cancelled) {
          setError("Could not read startup setting.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setAutostartEnabled = useCallback(async (enabled: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      await (enabled ? enable() : disable());
      setIsAutostartEnabled(await isEnabled());
    } catch (cause) {
      console.error("failed to update autostart setting", cause);
      setError("Could not update startup setting.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isAutostartEnabled, isLoading, error, setAutostartEnabled };
}
