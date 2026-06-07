interface SettingsToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: SettingsToggleRowProps) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="block text-sm text-neutral-200">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs text-neutral-500">
            {description}
          </span>
        ) : null}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:cursor-default disabled:opacity-50 ${
          checked ? "bg-white" : "bg-neutral-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-neutral-950 transition ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
