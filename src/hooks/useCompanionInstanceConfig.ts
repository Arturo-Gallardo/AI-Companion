import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
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

function instancesMatch(
  current: CompanionInstance,
  next: CompanionInstance,
): boolean {
  return JSON.stringify(current) === JSON.stringify(next);
}

// loads this window's instance config. unrelated registry events keep the
// existing registry object so other companions do not restart their behavior.
export function useCompanionInstanceConfig(): CompanionInstanceConfig | null {
  const [config, setConfig] = useState<CompanionInstanceConfig | null>(null);
  const configRef = useRef<CompanionInstanceConfig | null>(null);
  const manifestSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const id = getCurrentInstanceId();
    if (id === null) {
      return;
    }

    let cancelled = false;
    let unlistenRegistry: (() => void) | undefined;
    let unlistenLibrary: (() => void) | undefined;
    let reloadQueue = Promise.resolve();

    const commit = (
      next: CompanionInstanceConfig | null,
      manifestSignature = manifestSignatureRef.current,
    ) => {
      if (cancelled) {
        return;
      }

      configRef.current = next;
      manifestSignatureRef.current = next ? manifestSignature : null;
      setConfig(next);
    };

    const reloadFull = async () => {
      const instance = await getInstance(id);
      if (!instance || cancelled) {
        commit(null);
        return;
      }

      const character = await getCharacter(instance.characterId);
      if (!character || cancelled) {
        commit(null);
        return;
      }

      const manifestSignature = JSON.stringify(character.manifest);
      const current = configRef.current;
      if (
        current &&
        current.instance.characterId === instance.characterId &&
        manifestSignatureRef.current === manifestSignature
      ) {
        if (!instancesMatch(current.instance, instance)) {
          commit({ instance, registry: current.registry });
        }
        return;
      }

      const registry = await buildAnimationRegistry(character);
      commit({ instance, registry }, manifestSignature);
    };

    const reloadInstance = async () => {
      const instance = await getInstance(id);
      if (cancelled) {
        return;
      }

      const current = configRef.current;
      if (!instance) {
        commit(null);
        return;
      }
      if (!current || current.instance.characterId !== instance.characterId) {
        await reloadFull();
        return;
      }
      if (instancesMatch(current.instance, instance)) {
        return;
      }

      commit({ instance, registry: current.registry });
    };

    const enqueue = (reload: () => Promise<void>) => {
      reloadQueue = reloadQueue.then(reload).catch((error: unknown) => {
        console.error("failed to reload companion config", error);
      });
    };

    void (async () => {
      const stopRegistry = await listen(COMPANION_REGISTRY_EVENT, () => {
        enqueue(reloadInstance);
      });
      if (cancelled) {
        stopRegistry();
        return;
      }
      unlistenRegistry = stopRegistry;

      const stopLibrary = await listen(CHARACTER_LIBRARY_EVENT, () => {
        enqueue(reloadFull);
      });
      if (cancelled) {
        stopLibrary();
        return;
      }
      unlistenLibrary = stopLibrary;
      enqueue(reloadFull);
    })();

    return () => {
      cancelled = true;
      unlistenRegistry?.();
      unlistenLibrary?.();
    };
  }, []);

  return config;
}
