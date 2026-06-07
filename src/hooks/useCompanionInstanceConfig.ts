import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import {
  buildAnimationRegistry,
  type AnimationRegistry,
} from "../services/animationRegistry";
import {
  CHARACTER_LIBRARY_EVENT,
  getCharacter,
} from "../services/characterLibrary";
import { getCurrentInstanceId } from "../services/companionInstanceContext";
import {
  COMPANION_REGISTRY_EVENT,
  getInstance,
} from "../services/companionInstanceManager";
import type { CompanionInstance } from "../types/companionInstance";

export interface CompanionInstanceConfig {
  instance: CompanionInstance;
  registry: AnimationRegistry;
}

// loads the persisted instance + its character animation registry for the
// companion window this code runs in. stays in sync when the dashboard edits
// instance settings or character frames.
export function useCompanionInstanceConfig(): CompanionInstanceConfig | null {
  const [config, setConfig] = useState<CompanionInstanceConfig | null>(null);

  const reload = useCallback(async (cancelled: () => boolean) => {
    const id = getCurrentInstanceId();
    if (id === null) {
      return;
    }

    const instance = await getInstance(id);
    if (!instance || cancelled()) {
      return;
    }

    const character = await getCharacter(instance.characterId);
    if (!character) {
      if (!cancelled()) {
        setConfig(null);
      }
      return;
    }

    const registry = await buildAnimationRegistry(character);

    if (!cancelled()) {
      setConfig({ instance, registry });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    void reload(isCancelled);

    let unlistenRegistry: (() => void) | undefined;
    let unlistenLibrary: (() => void) | undefined;

    void (async () => {
      unlistenRegistry = await listen(COMPANION_REGISTRY_EVENT, () => {
        void reload(isCancelled);
      });
      unlistenLibrary = await listen(CHARACTER_LIBRARY_EVENT, () => {
        void reload(isCancelled);
      });
    })();

    return () => {
      cancelled = true;
      unlistenRegistry?.();
      unlistenLibrary?.();
    };
  }, [reload]);

  return config;
}
