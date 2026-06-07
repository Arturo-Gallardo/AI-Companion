import { useEffect, useState } from "react";
import {
  buildAnimationRegistry,
  type AnimationRegistry,
} from "../services/animationRegistry";
import { getCharacter } from "../services/characterLibrary";

// loads the animation registry for a character id (dashboard preview, etc.)
export function useCharacterAnimationRegistry(
  characterId: string | undefined,
): AnimationRegistry | null {
  const [registry, setRegistry] = useState<AnimationRegistry | null>(null);

  useEffect(() => {
    if (characterId === undefined) {
      setRegistry(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      const character = await getCharacter(characterId);
      if (character === null) {
        if (!cancelled) {
          setRegistry(null);
        }
        return;
      }

      const next = await buildAnimationRegistry(character);

      if (!cancelled) {
        setRegistry(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  return registry;
}
