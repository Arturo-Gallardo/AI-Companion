import { useCallback, useEffect, useMemo, useState } from "react";
import { setCompanionEnabled } from "../services/companionApi";
import type { Tomoji } from "../types/tomoji";

const DEFAULT_TOMOJI: Tomoji = {
  id: "default",
  name: "name",
  isActive: true,
  isDefault: true,
};

interface UseTomojisResult {
  tomojis: Tomoji[];
  addTomoji: () => void;
  deleteTomoji: (id: string) => void;
  toggleTomoji: (id: string) => void;
}

function getNextTomojiName(tomojis: Tomoji[]): string {
  return `Tomoji ${tomojis.length + 1}`;
}

function syncCompanionEnabled(tomojis: Tomoji[]) {
  void setCompanionEnabled(tomojis.some((tomoji) => tomoji.isActive)).catch(
    (error: unknown) => {
      console.error("failed to update companion visibility", error);
    },
  );
}

export function useTomojis(): UseTomojisResult {
  const [tomojis, setTomojis] = useState<Tomoji[]>([DEFAULT_TOMOJI]);

  useEffect(() => {
    syncCompanionEnabled(tomojis);
  }, [tomojis]);

  const addTomoji = useCallback(() => {
    setTomojis((currentTomojis) => [
      ...currentTomojis,
      {
        id: crypto.randomUUID(),
        name: getNextTomojiName(currentTomojis),
        isActive: false,
        isDefault: false,
      },
    ]);
  }, []);

  const deleteTomoji = useCallback((id: string) => {
    setTomojis((currentTomojis) =>
      currentTomojis.filter(
        (tomoji) => tomoji.id !== id || tomoji.isDefault,
      ),
    );
  }, []);

  const toggleTomoji = useCallback((id: string) => {
    setTomojis((currentTomojis) =>
      currentTomojis.map((tomoji) =>
        tomoji.id === id
          ? { ...tomoji, isActive: !tomoji.isActive }
          : tomoji,
      ),
    );
  }, []);

  return useMemo(
    () => ({ tomojis, addTomoji, deleteTomoji, toggleTomoji }),
    [addTomoji, deleteTomoji, toggleTomoji, tomojis],
  );
}
