import { useCallback, useMemo, useState } from "react";
import {
  listShimejiFrames,
  pickShimejiImgFolder,
} from "../services/shimejiImporter";
import { buildShimejiPresetAssignments } from "../constants/shimejiFramePresets";
import { ANIMATION_CATEGORIES } from "../types/character";
import type { AnimationCategory, BehaviorSettings } from "../types/character";
import type {
  CategoryAssignments,
  ShimejiDraft,
} from "../types/shimejiDraft";
import { getImageSize } from "../utils/imageSize";

const DEFAULT_FPS = 8;
const DEFAULT_FRAME_SIZE = 128;

function emptyAssignments(): CategoryAssignments {
  return ANIMATION_CATEGORIES.reduce((accumulator, category) => {
    accumulator[category] = { frames: [], fps: DEFAULT_FPS };
    return accumulator;
  }, {} as CategoryAssignments);
}

function initialDraft(): ShimejiDraft {
  return {
    imgDir: null,
    sources: [],
    assignments: emptyAssignments(),
    name: "",
    dialogueLines: [],
    dialogueFrequency: 0.2,
    behavior: { movementSpeed: 1, actionFrequency: 0.5, dialogueFrequency: 0.2 },
    scale: 1,
    speed: 2,
    frameWidth: DEFAULT_FRAME_SIZE,
    frameHeight: DEFAULT_FRAME_SIZE,
  };
}

export function useShimejiDraft() {
  const [draft, setDraft] = useState<ShimejiDraft>(initialDraft);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const urlByPath = useMemo(() => {
    const map = new Map<string, string>();
    for (const source of draft.sources) {
      map.set(source.path, source.url);
    }
    return map;
  }, [draft.sources]);

  const urlFor = useCallback(
    (path: string) => urlByPath.get(path) ?? path,
    [urlByPath],
  );

  const framesUrls = useCallback(
    (category: AnimationCategory) =>
      draft.assignments[category].frames.map((path) => urlFor(path)),
    [draft.assignments, urlFor],
  );

  const loadImgFolder = useCallback(async () => {
    const dir = await pickShimejiImgFolder();
    if (dir === null) {
      return;
    }

    setIsLoadingFolder(true);
    try {
      const sources = await listShimejiFrames(dir);
      let frameWidth = DEFAULT_FRAME_SIZE;
      let frameHeight = DEFAULT_FRAME_SIZE;

      if (sources.length > 0) {
        try {
          const size = await getImageSize(sources[0].url);
          frameWidth = size.width;
          frameHeight = size.height;
        } catch {
          // fall back to the default frame size if the png can't be measured
        }
      }

      const presets = buildShimejiPresetAssignments(sources);
      const assignments = emptyAssignments();
      for (const category of ANIMATION_CATEGORIES) {
        const preset = presets[category];
        if (preset) {
          assignments[category] = {
            frames: preset.frames,
            fps: preset.fps,
          };
        }
      }

      setDraft((current) => ({
        ...current,
        imgDir: dir,
        sources,
        assignments,
        frameWidth,
        frameHeight,
      }));
    } finally {
      setIsLoadingFolder(false);
    }
  }, []);

  const toggleFrame = useCallback(
    (category: AnimationCategory, path: string) => {
      setDraft((current) => {
        const assignment = current.assignments[category];
        const exists = assignment.frames.includes(path);
        const frames = exists
          ? assignment.frames.filter((frame) => frame !== path)
          : [...assignment.frames, path];

        return {
          ...current,
          assignments: {
            ...current.assignments,
            [category]: { ...assignment, frames },
          },
        };
      });
    },
    [],
  );

  const removeFrame = useCallback(
    (category: AnimationCategory, index: number) => {
      setDraft((current) => {
        const assignment = current.assignments[category];
        const frames = assignment.frames.filter((_, i) => i !== index);
        return {
          ...current,
          assignments: {
            ...current.assignments,
            [category]: { ...assignment, frames },
          },
        };
      });
    },
    [],
  );

  const moveFrame = useCallback(
    (category: AnimationCategory, index: number, direction: -1 | 1) => {
      setDraft((current) => {
        const assignment = current.assignments[category];
        const target = index + direction;
        if (target < 0 || target >= assignment.frames.length) {
          return current;
        }

        const frames = [...assignment.frames];
        [frames[index], frames[target]] = [frames[target], frames[index]];

        return {
          ...current,
          assignments: {
            ...current.assignments,
            [category]: { ...assignment, frames },
          },
        };
      });
    },
    [],
  );

  const setFps = useCallback((category: AnimationCategory, fps: number) => {
    setDraft((current) => ({
      ...current,
      assignments: {
        ...current.assignments,
        [category]: { ...current.assignments[category], fps },
      },
    }));
  }, []);

  const setName = useCallback((name: string) => {
    setDraft((current) => ({ ...current, name }));
  }, []);

  const addDialogueLine = useCallback((line: string) => {
    const trimmed = line.trim();
    if (trimmed === "") {
      return;
    }
    setDraft((current) => ({
      ...current,
      dialogueLines: [...current.dialogueLines, trimmed],
    }));
  }, []);

  const removeDialogueLine = useCallback((index: number) => {
    setDraft((current) => ({
      ...current,
      dialogueLines: current.dialogueLines.filter((_, i) => i !== index),
    }));
  }, []);

  const setDialogueFrequency = useCallback((dialogueFrequency: number) => {
    setDraft((current) => ({ ...current, dialogueFrequency }));
  }, []);

  const patchBehavior = useCallback((patch: Partial<BehaviorSettings>) => {
    setDraft((current) => ({
      ...current,
      behavior: { ...current.behavior, ...patch },
    }));
  }, []);

  const setScale = useCallback((scale: number) => {
    setDraft((current) => ({ ...current, scale }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setDraft((current) => ({ ...current, speed }));
  }, []);

  return {
    draft,
    isLoadingFolder,
    urlFor,
    framesUrls,
    loadImgFolder,
    toggleFrame,
    removeFrame,
    moveFrame,
    setFps,
    setName,
    addDialogueLine,
    removeDialogueLine,
    setDialogueFrequency,
    patchBehavior,
    setScale,
    setSpeed,
  };
}

export type ShimejiDraftController = ReturnType<typeof useShimejiDraft>;
