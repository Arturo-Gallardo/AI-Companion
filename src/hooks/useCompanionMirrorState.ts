import { useEffect, useState } from "react";
import { listenMirrorState } from "../services/companionMirror";
import {
  DEFAULT_COMPANION_MIRROR_STATE,
  type CompanionMirrorState,
} from "../types/companionMirror";

export function useCompanionMirrorState(): CompanionMirrorState {
  const [mirrorState, setMirrorState] = useState<CompanionMirrorState>(
    DEFAULT_COMPANION_MIRROR_STATE,
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listenMirrorState((state) => {
      setMirrorState(state);
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  return mirrorState;
}
