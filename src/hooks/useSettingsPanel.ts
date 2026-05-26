import { useCallback, useEffect, useState } from "react";

interface UseSettingsPanelResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useSettingsPanel(): UseSettingsPanelResult {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  return { isOpen, open, close };
}
