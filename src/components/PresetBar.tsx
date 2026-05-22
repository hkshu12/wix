import { PRESETS, useMixerStore } from '../store/mixerStore'

export function PresetBar() {
  const applyPreset = useMixerStore((s) => s.applyPreset)

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {Object.entries(PRESETS).map(([key, preset]) => (
        <button
          key={key}
          type="button"
          onClick={() => void applyPreset(preset.ids)}
          className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent-muted)] transition-colors"
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
