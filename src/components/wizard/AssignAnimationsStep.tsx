import { useState } from "react";
import {
  ANIMATION_CATEGORY_GROUPS,
  ANIMATION_CATEGORY_META,
} from "../../constants/animationCategories";
import type { ShimejiDraftController } from "../../hooks/useShimejiDraft";
import type { AnimationCategory } from "../../types/character";
import { AnimationAssignmentPanel } from "./AnimationAssignmentPanel";

interface AssignAnimationsStepProps {
  controller: ShimejiDraftController;
}

export function AssignAnimationsStep({ controller }: AssignAnimationsStepProps) {
  const [active, setActive] = useState<AnimationCategory>("idle");
  const { draft } = controller;

  return (
    <div className="space-y-5">
      {ANIMATION_CATEGORY_GROUPS.map((group) => (
        <section key={group.id}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
            {group.label}
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.categories.map((category) => {
              const count = draft.assignments[category].frames.length;
              const meta = ANIMATION_CATEGORY_META[category];
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActive(category)}
                  title={meta.description}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    active === category
                      ? "bg-white text-black"
                      : "bg-neutral-800 text-neutral-300 hover:text-white"
                  }`}
                >
                  {meta.label}
                  {count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <AnimationAssignmentPanel controller={controller} category={active} />
    </div>
  );
}
