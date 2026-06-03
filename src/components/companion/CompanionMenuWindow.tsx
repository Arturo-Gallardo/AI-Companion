import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useMemo, useState } from "react";
import {
  emitCompanionMenuAction,
  hideCompanionMenu,
  listenCompanionMenuConfig,
} from "../../services/companionMenuApi";
import type { CompanionMenuAction } from "../../types/companionMenu";

const STATIC_MENU_ITEMS: { action: CompanionMenuAction; label: string }[] = [
  { action: "turnAround", label: "Turn around" },
  { action: "sit", label: "Sit" },
];

export function CompanionMenuWindow() {
  const [wallLocked, setWallLocked] = useState(false);
  const [undersideLocked, setUndersideLocked] = useState(false);
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    let unlistenFocus: (() => void) | undefined;
    let unlistenConfig: (() => void) | undefined;

    void getCurrentWebviewWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (!focused) {
          void hideCompanionMenu();
        }
      })
      .then((cleanup) => {
        unlistenFocus = cleanup;
      });

    void listenCompanionMenuConfig(
      ({
        wallLocked: nextWallLocked,
        undersideLocked: nextUndersideLocked,
        frozen: nextFrozen,
      }) => {
        setWallLocked(nextWallLocked);
        setUndersideLocked(nextUndersideLocked);
        setFrozen(nextFrozen);
      },
    ).then((cleanup) => {
      unlistenConfig = cleanup;
    });

    return () => {
      unlistenFocus?.();
      unlistenConfig?.();
    };
  }, []);

  const menuItems = useMemo(() => {
    const travelItem = undersideLocked
      ? { action: "crawlTo" as const, label: "Crawl to…" }
      : wallLocked
        ? { action: "climbTo" as const, label: "Climb to…" }
        : { action: "walkTo" as const, label: "Walk to…" };

    const freezeItem = frozen
      ? { action: "toggleFreeze" as const, label: "Unfreeze" }
      : { action: "toggleFreeze" as const, label: "Freeze" };

    return [travelItem, ...STATIC_MENU_ITEMS, freezeItem];
  }, [frozen, undersideLocked, wallLocked]);

  const handleAction = (action: CompanionMenuAction) => {
    void hideCompanionMenu().then(() => {
      void emitCompanionMenuAction(action);
    });
  };

  return (
    <nav className="flex h-full w-full flex-col gap-1 rounded-md border border-neutral-600/90 bg-neutral-900/95 p-1.5 shadow-lg">
      {menuItems.map((item) => (
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
