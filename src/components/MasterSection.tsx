import { Headphones, Sparkles, SunMedium, Gauge } from 'lucide-react'
import { SliderRow } from './ui/SliderRow'
import { useMixerStore } from '../stores/mixerStore'

export function MasterSection() {
  const masterVolume = useMixerStore((s) => s.masterVolume)
  const toneBrightness = useMixerStore((s) => s.toneBrightness)
  const globalRate = useMixerStore((s) => s.globalRate)
  const setMasterVolume = useMixerStore((s) => s.setMasterVolume)
  const setToneBrightness = useMixerStore((s) => s.setToneBrightness)
  const setGlobalRate = useMixerStore((s) => s.setGlobalRate)

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-300">
        <Headphones className="size-4 text-cyan-400" aria-hidden />
        主控
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <SliderRow
          label="总音量"
          hint="所有轨道的输出"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={setMasterVolume}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <SliderRow
          label="明亮度"
          hint="母线空气感 / 高频通透"
          min={0}
          max={1}
          step={0.01}
          value={toneBrightness}
          onChange={setToneBrightness}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <SliderRow
          label="全局倍速"
          hint="作用于全部循环层"
          min={0.5}
          max={1.6}
          step={0.01}
          value={globalRate}
          onChange={setGlobalRate}
          format={(v) => `${v.toFixed(2)}×`}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3.5 text-violet-400/80" aria-hidden />
          立体声声像与单轨倍速在下方每层中调节
        </span>
        <span className="inline-flex items-center gap-1">
          <SunMedium className="size-3.5 text-amber-400/80" aria-hidden />
          内置层为程序合成，可完全离线
        </span>
        <span className="inline-flex items-center gap-1">
          <Gauge className="size-3.5 text-cyan-400/80" aria-hidden />
          导入音频保存在本机 IndexedDB
        </span>
      </div>
    </section>
  )
}
