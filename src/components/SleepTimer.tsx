import { Moon } from 'lucide-react'
import { useMixerStore } from '../store/mixerStore'

const OPTIONS = [15, 30, 45, 60, 90]

export function SleepTimer() {
  const minutes = useMixerStore((s) => s.settings.sleepTimerMinutes)
  const setSleepTimer = useMixerStore((s) => s.setSleepTimer)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Moon size={18} className="text-[var(--color-accent)]" />
        <span className="font-medium text-sm">睡眠定时</span>
        {minutes && (
          <span className="ml-auto text-xs text-[var(--color-accent)]">{minutes} 分钟后停止</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setSleepTimer(minutes === m ? null : m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              minutes === m
                ? 'bg-[var(--color-accent)] text-[var(--color-surface)]'
                : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {m}分
          </button>
        ))}
        {minutes && (
          <button
            type="button"
            onClick={() => setSleepTimer(null)}
            className="rounded-lg px-3 py-1.5 text-xs text-red-400/80"
          >
            取消
          </button>
        )}
      </div>
    </div>
  )
}
