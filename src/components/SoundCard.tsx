import { motion, AnimatePresence } from 'framer-motion'
import { VolumeX, Trash2 } from 'lucide-react'
import type { SoundMeta } from '../audio/types'
import { useMixerStore } from '../store/mixerStore'

interface SoundCardProps {
  meta: SoundMeta
}

export function SoundCard({ meta }: SoundCardProps) {
  const track = useMixerStore((s) => s.tracks[meta.id])
  const toggleTrack = useMixerStore((s) => s.toggleTrack)
  const setTrackVolume = useMixerStore((s) => s.setTrackVolume)
  const setTrackPan = useMixerStore((s) => s.setTrackPan)
  const setTrackRate = useMixerStore((s) => s.setTrackRate)
  const toggleTrackMute = useMixerStore((s) => s.toggleTrackMute)
  const removeCustomSound = useMixerStore((s) => s.removeCustomSound)

  if (!track) return null
  const active = track.active

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-colors ${
        active
          ? 'border-[var(--color-accent)]/50 bg-[var(--color-surface-card)] shadow-lg shadow-teal-900/20'
          : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)]'
      }`}
    >
      <button
        type="button"
        onClick={() => void toggleTrack(meta.id)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl" aria-hidden>
          {meta.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{meta.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{meta.nameEn}</p>
        </div>
        <div
          className={`h-3 w-3 rounded-full transition-colors ${
            active ? 'bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]' : 'bg-[var(--color-border)]'
          }`}
        />
      </button>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border)]/50 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] w-10">音量</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={track.muted ? 0 : track.volume}
                  onChange={(e) => void setTrackVolume(meta.id, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => void toggleTrackMute(meta.id)}
                  className="text-[var(--color-text-muted)]"
                >
                  <VolumeX size={16} className={track.muted ? 'text-red-400' : ''} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] w-10">立体声</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">L</span>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={track.pan}
                  onChange={(e) => void setTrackPan(meta.id, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[10px] text-[var(--color-text-muted)]">R</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] w-10">速度</span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={track.playbackRate}
                  onChange={(e) => void setTrackRate(meta.id, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-[var(--color-text-muted)] w-10 tabular-nums">
                  {track.playbackRate.toFixed(1)}×
                </span>
              </div>

              {!meta.builtin && (
                <button
                  type="button"
                  onClick={() => void removeCustomSound(meta.id)}
                  className="flex items-center gap-1 text-xs text-red-400/80 hover:text-red-400"
                >
                  <Trash2 size={14} />
                  删除自定义音频
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
