import { useMixerStore } from '../store/mixerStore'
import { SoundCard } from './SoundCard'

export function SoundGrid() {
  const sounds = useMixerStore((s) => s.sounds)
  const builtins = sounds.filter((s) => s.builtin)
  const customs = sounds.filter((s) => !s.builtin)

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          内置环境音
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {builtins.map((meta) => (
            <SoundCard key={meta.id} meta={meta} />
          ))}
        </div>
      </section>

      {customs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            我的音频
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {customs.map((meta) => (
              <SoundCard key={meta.id} meta={meta} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
