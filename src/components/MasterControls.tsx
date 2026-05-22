import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { useMixerStore } from '../store/mixerStore'

export function MasterControls() {
  const isPlaying = useMixerStore((s) => s.isPlaying)
  const settings = useMixerStore((s) => s.settings)
  const togglePlay = useMixerStore((s) => s.togglePlay)
  const setMasterVolume = useMixerStore((s) => s.setMasterVolume)
  const toggleMasterMute = useMixerStore((s) => s.toggleMasterMute)

  return (
    <div className="sticky bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void togglePlay()}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-surface)] shadow-lg shadow-teal-500/25 transition-transform active:scale-95"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-0.5" />}
        </button>

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleMasterMute}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label={settings.masterMuted ? '取消静音' : '主音量静音'}
          >
            {settings.masterMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.masterMuted ? 0 : settings.masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="flex-1"
            aria-label="主音量"
          />
          <span className="text-xs text-[var(--color-text-muted)] w-8 text-right tabular-nums">
            {Math.round((settings.masterMuted ? 0 : settings.masterVolume) * 100)}
          </span>
        </div>
      </div>
    </div>
  )
}
