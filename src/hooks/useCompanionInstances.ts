import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COMPANION_REGISTRY_EVENT,
  addInstance,
  listInstances,
  removeInstance,
  setInstanceEnabled,
  updateInstance,
} from "../services/companionInstanceManager";
import type { CompanionInstance } from "../types/companionInstance";

interface UseCompanionInstancesResult {
  instances: CompanionInstance[];
  isLoading: boolean;
  addCompanion: (characterId: string, name?: string) => Promise<void>;
  removeCompanion: (id: string) => Promise<void>;
  toggleCompanion: (id: string, enabled: boolean) => Promise<void>;
  updateCompanion: (
    id: string,
    patch: Partial<Omit<CompanionInstance, "id">>,
  ) => Promise<void>;
}

// dashboard-facing view of the companion registry. stays in sync with the
// persisted instances.json via the registry-changed broadcast.
export function useCompanionInstances(): UseCompanionInstancesResult {
  const [instances, setInstances] = useState<CompanionInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setInstances(await listInstances());
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      await refresh();
      if (!cancelled) {
        setIsLoading(false);
      }
      unlisten = await listen(COMPANION_REGISTRY_EVENT, () => {
        void refresh();
      });
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [refresh]);

  const addCompanion = useCallback(
    async (characterId: string, name?: string) => {
      await addInstance(characterId, name);
    },
    [],
  );

  const removeCompanion = useCallback(async (id: string) => {
    await removeInstance(id);
  }, []);

  const toggleCompanion = useCallback(async (id: string, enabled: boolean) => {
    await setInstanceEnabled(id, enabled);
  }, []);

  const updateCompanion = useCallback(
    async (id: string, patch: Partial<Omit<CompanionInstance, "id">>) => {
      await updateInstance(id, patch);
    },
    [],
  );

  return useMemo(
    () => ({
      instances,
      isLoading,
      addCompanion,
      removeCompanion,
      toggleCompanion,
      updateCompanion,
    }),
    [
      addCompanion,
      instances,
      isLoading,
      removeCompanion,
      toggleCompanion,
      updateCompanion,
    ],
  );
}
