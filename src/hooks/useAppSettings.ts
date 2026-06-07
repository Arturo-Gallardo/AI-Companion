import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import {
  APP_SETTINGS_EVENT,
  getAppSettings,
  updateAppSettings as persistAppSettings,
} from "../services/appSettings";
import type { AppSettings } from "../types/appSettings";

interface UseAppSettingsResult {
  settings: AppSettings | null;
  isLoading: boolean;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

export function useAppSettings(): UseAppSettingsResult {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSettings(await getAppSettings());
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      await refresh();
      if (!cancelled) {
        setIsLoading(false);
      }
      unlisten = await listen<AppSettings>(APP_SETTINGS_EVENT, (event) => {
        setSettings(event.payload);
      });
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [refresh]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings(await persistAppSettings(patch));
  }, []);

  return { settings, isLoading, updateSettings };
}
