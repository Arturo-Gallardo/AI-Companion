import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";
import {
  emitCompanionMenuAction,
  hideCompanionMenu,
} from "../../services/companionMenuApi";
import type { CompanionMenuAction } from "../../types/companionMenu";

const MENU_ITEMS: { action: CompanionMenuAction; label: string }[] = [
  { action: "walkTo", label: "Walk to…" },
  { action: "turnAround", label: "Turn around" },
  { action: "sit", label: "Sit" },
];

export function CompanionMenuWindow() {
  useEffect(() => {
    let unlistenFocus: (() => void) | undefined;

    void getCurrentWebviewWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (!focused) {
          void hideCompanionMenu();
        }
      })
      .then((cleanup) => {
        unlistenFocus = cleanup;
      });

    return () => {
      unlistenFocus?.();
    };
  }, []);

  const handleAction = (action: CompanionMenuAction) => {
    void hideCompanionMenu().then(() => {
      void emitCompanionMenuAction(action);
    });
  };

  return (
    <nav className="flex h-full w-full flex-col gap-1 rounded-md border border-neutral-600/90 bg-neutral-900/95 p-1.5 shadow-lg">
      {MENU_ITEMS.map((item) => (
        <button
          key={item.action}
          type="button"
          onClick={() => {
            handleAction(item.action);
          }}
          className="rounded px-2.5 py-1.5 text-left text-sm text-neutral-100 hover:bg-neutral-700/90"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
