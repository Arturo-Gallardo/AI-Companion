import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import { getCharactersFolderFingerprint } from "../services/charactersFolderWatcher";
import { reconcileTomojiRegistry } from "../services/companionInstanceManager";

const POLL_MS = 8000;
const DEBOUNCE_MS = 1000;
const COPY_SETTLE_MS = 750;

// picks up folders copied into <appData>/characters without heavy constant resync
export function useCharactersFolderAutoSync(): void {
  const fingerprintRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let unlistenFocus: (() => void) | undefined;

    const runSync = async () => {
      if (cancelled || syncInFlightRef.current) {
        return;
      }

      syncInFlightRef.current = true;
      try {
        const fingerprint = await getCharactersFolderFingerprint();
        if (fingerprintRef.current === null) {
          fingerprintRef.current = fingerprint;
          return;
        }

        if (fingerprint === fingerprintRef.current) {
          return;
        }

        await new Promise((resolve) => {
          setTimeout(resolve, COPY_SETTLE_MS);
        });
        if (cancelled) {
          return;
        }

        const settledFingerprint = await getCharactersFolderFingerprint();
        if (settledFingerprint !== fingerprint) {
          scheduleSync();
          return;
        }

        await reconcileTomojiRegistry({ spawnNew: true });
        fingerprintRef.current = settledFingerprint;
      } catch (error) {
        console.error("characters folder auto-sync failed", error);
      } finally {
        syncInFlightRef.current = false;
      }
    };

    const scheduleSync = () => {
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        void runSync();
      }, DEBOUNCE_MS);
    };

    void (async () => {
      fingerprintRef.current = await getCharactersFolderFingerprint();
      if (cancelled) {
        return;
      }

      pollTimer = setInterval(() => {
        scheduleSync();
      }, POLL_MS);

      const stopListening = await getCurrentWindow().onFocusChanged(
        ({ payload: focused }) => {
          if (focused) {
            scheduleSync();
          }
        },
      );
      if (cancelled) {
        stopListening();
        clearInterval(pollTimer);
        pollTimer = undefined;
        return;
      }
      unlistenFocus = stopListening;
    })();

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) {
        clearInterval(pollTimer);
      }
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }
      unlistenFocus?.();
    };
  }, []);
}
