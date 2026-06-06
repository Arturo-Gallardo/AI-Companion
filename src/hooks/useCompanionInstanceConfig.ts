import { useEffect, useState } from "react";
import {
  buildAnimationRegistry,
  type AnimationRegistry,
} from "../services/animationRegistry";
import {
  BUILTIN_CHARACTER_ENTRY,
  getCharacter,
} from "../services/characterLibrary";
import { getCurrentInstanceId } from "../services/companionInstanceContext";
import { getInstance } from "../services/companionInstanceManager";
import type { CompanionInstance } from "../types/companionInstance";

export interface CompanionInstanceConfig {
  instance: CompanionInstance;
  registry: AnimationRegistry;
}

// loads the persisted instance + its character animation registry for the
// companion window this code runs in.
export function useCompanionInstanceConfig(): CompanionInstanceConfig | null {
  const [config, setConfig] = useState<CompanionInstanceConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = getCurrentInstanceId();
    if (id === null) {
      return;
    }

    void (async () => {
      const instance = await getInstance(id);
      if (!instance) {
        return;
      }

      const character =
        (await getCharacter(instance.characterId)) ?? BUILTIN_CHARACTER_ENTRY;
      const registry = await buildAnimationRegistry(character);

      if (!cancelled) {
        setConfig({ instance, registry });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
