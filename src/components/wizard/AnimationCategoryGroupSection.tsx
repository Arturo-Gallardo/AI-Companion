import {
  ANIMATION_CATEGORY_META,
  type AnimationCategoryGroup,
} from "../../constants/animationCategories";
import type { CategoryAssignments } from "../../types/shimejiDraft";
import {
  isRequiredAnimationCategory,
  type AnimationCategory,
} from "../../types/character";
import { RequiredAnimationBadge } from "./AnimationCategoryBadge";

interface AnimationCategoryGroupSectionProps {
  group: AnimationCategoryGroup;
  assignments: CategoryAssignments;
  active: AnimationCategory;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (category: AnimationCategory) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3 w-3 shrink-0 text-neutral-500 transition-transform ${
        open ? "rotate-90" : ""
      }`}
      fill="none"
      aria-hidden
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function groupHasMissingRequired(
  group: AnimationCategoryGroup,
  assignments: CategoryAssignments,
): boolean {
  for (const category of group.categories) {
    if (
      isRequiredAnimationCategory(category) &&
      assignments[category].frames.length === 0
    ) {
      return true;
    }
  }

  return false;
}

export function AnimationCategoryGroupSection({
  group,
  assignments,
  active,
  isOpen,
  onToggle,
  onSelect,
}: AnimationCategoryGroupSectionProps) {
  const missingRequired = groupHasMissingRequired(group, assignments);

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-neutral-900 ${
          missingRequired && !isOpen
            ? "border border-amber-500/30 bg-amber-500/5"
            : ""
        }`}
      >
        <ChevronIcon open={isOpen} />
        <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          {group.label}
        </span>
        {missingRequired ? (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
            title="Required animation missing"
            aria-hidden
          />
        ) : null}
      </button>

      {isOpen ? (
        <ul className="mt-1 flex flex-col gap-1 pl-1">
          {group.categories.map((category) => {
            const count = assignments[category].frames.length;
            const meta = ANIMATION_CATEGORY_META[category];
            const required = isRequiredAnimationCategory(category);
            const missingRequired = required && count === 0;
            const isActive = active === category;

            return (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => onSelect(category)}
                  title={meta.description}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${
                    isActive
                      ? "bg-white text-black"
                      : missingRequired
                        ? "border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:border-amber-400/60"
                        : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                  {required ? (
                    <RequiredAnimationBadge category={category} compact />
                  ) : null}
                  {count > 0 ? (
                    <span className="text-neutral-500">{count}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
