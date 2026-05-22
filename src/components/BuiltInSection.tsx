import { BUILTIN_CATALOG, type BuiltInId } from '../audio/builtins'
import { useMixerStore } from '../stores/mixerStore'

function layerId(b: BuiltInId) {
  return `b:${b}`
}

export function BuiltInSection() {
  const layers = useMixerStore((s) => s.layers)
  const toggleBuiltIn = useMixerStore((s) => s.toggleBuiltIn)
  const setLayerField = useMixerStore((s) => s.setLayerField)

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-100">环境声库</h2>
        <p className="mt-1 text-sm text-zinc-500">可多选叠加；以下为程序合成循环纹理</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {BUILTIN_CATALOG.map((b) => {
          const tid = layerId(b.id)
          const L = layers[tid]
          const on = L?.on ?? false
          return (
            <div
              key={b.id}
              className={`group relative flex flex-col rounded-xl border p-3 transition ${
                on
                  ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_0_1px_rgb(34_211_238_/0.15)]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleBuiltIn(b.id)}
                className="flex flex-1 flex-col items-start text-left"
              >
                <span className="text-2xl" aria-hidden>
                  {b.emoji}
                </span>
                <span className="mt-2 text-sm font-medium text-zinc-100">{b.label}</span>
                <span className="mt-1 line-clamp-2 text-xs text-zinc-500">{b.hint}</span>
              </button>
              {on ? (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    音量
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={L?.volume ?? 0.62}
                    onChange={(e) =>
                      setLayerField(tid, { volume: Number(e.target.value) })
                    }
                    className="ambient-range w-full"
                  />
                  <label className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    立体声 L — R
                  </label>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={L?.pan ?? 0}
                    onChange={(e) =>
                      setLayerField(tid, { pan: Number(e.target.value) })
                    }
                    className="ambient-range w-full"
                  />
                  <label className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    单轨倍速
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.6}
                    step={0.01}
                    value={L?.rate ?? 1}
                    onChange={(e) =>
                      setLayerField(tid, { rate: Number(e.target.value) })
                    }
                    className="ambient-range w-full"
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
