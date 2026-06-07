import { useEffect, useState } from "react";
import { listenMirrorState } from "../services/companionMirror";
import {
  DEFAULT_COMPANION_MIRROR_STATE,
  type CompanionMirrorState,
} from "../types/companionMirror";

// mirrors a single companion (the default one) onto the dashboard preview.
export function useCompanionMirrorState(
  instanceId = "default",
): CompanionMirrorState {
  const [mirrorState, setMirrorState] = useState<CompanionMirrorState>(
    DEFAULT_COMPANION_MIRROR_STATE,
  );

  useEffect(() => {
    setMirrorState({ ...DEFAULT_COMPANION_MIRROR_STATE, instanceId });
  }, [instanceId]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listenMirrorState((state) => {
      if (state.instanceId === instanceId) {
        setMirrorState(state);
      }
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, [instanceId]);

  return mirrorState;
}
