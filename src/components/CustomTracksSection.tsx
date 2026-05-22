import { useEffect, useState } from 'react'
import { Disc3, Trash2, UploadCloud } from 'lucide-react'
import { mixerEngine, trackIdCustom } from '../audio/MixerEngine'
import {
  deleteCustomTrack,
  listCustomTracks,
  saveCustomTrack,
  type CustomTrackRow,
} from '../db/customTracks'
import { getCustomBuffer, registerCustomBuffer, unregisterCustomBuffer } from '../audio/customBufferCache'
import { useMixerStore } from '../stores/mixerStore'

async function decodeToBuffer(data: ArrayBuffer): Promise<AudioBuffer> {
  const oac = new OfflineAudioContext({ length: 1, sampleRate: 48_000 })
  return oac.decodeAudioData(data.slice(0))
}

export function CustomTracksSection() {
  const [rows, setRows] = useState<CustomTrackRow[]>([])
  const [busy, setBusy] = useState(false)
  const layers = useMixerStore((s) => s.layers)
  const toggleCustom = useMixerStore((s) => s.toggleCustom)
  const setLayerField = useMixerStore((s) => s.setLayerField)
  const ensureLayer = useMixerStore((s) => s.ensureLayer)
  const removeLayerState = useMixerStore((s) => s.removeLayerState)
  const bumpAssets = useMixerStore((s) => s.bumpAssets)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const list = await listCustomTracks()
      if (cancelled) return
      setRows(list)
      for (const r of list) {
        if (cancelled) return
        if (getCustomBuffer(r.id)) continue
        try {
          const buf = await decodeToBuffer(r.data)
          registerCustomBuffer(r.id, buf)
        } catch {
          /* skip corrupt */
        }
      }
      if (!cancelled) {
        queueMicrotask(() => bumpAssets())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bumpAssets])

  const reloadRows = () => void listCustomTracks().then(setRows)

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      for (const file of Array.from(files)) {
        const ab = await file.arrayBuffer()
        const saved = await saveCustomTrack(file.name.replace(/\.[^/.]+$/, '') || '导入音频', ab)
        const buf = await decodeToBuffer(saved.data)
        registerCustomBuffer(saved.id, buf)
        ensureLayer(trackIdCustom(saved.id), { on: true })
      }
      reloadRows()
      bumpAssets()
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async (id: string) => {
    const tid = trackIdCustom(id)
    mixerEngine.removeTrack(tid)
    unregisterCustomBuffer(id)
    removeLayerState(tid)
    await deleteCustomTrack(id)
    reloadRows()
    bumpAssets()
  }

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">我的导入</h2>
          <p className="mt-1 text-sm text-zinc-500">
            支持常见无损/有损格式；数据写入 IndexedDB，重装前一直保留
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/90 to-violet-500/90 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-[0.99]">
          <UploadCloud className="size-4" aria-hidden />
          {busy ? '导入中…' : '导入音频'}
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.webm"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onPickFiles(e.target.files)}
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-sm text-zinc-500">
          暂无导入。选择文件后将自动解码并出现在列表中，可与其他环境声同时播放。
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const tid = trackIdCustom(r.id)
            const L = layers[tid]
            const on = L?.on ?? false
            const ready = Boolean(getCustomBuffer(r.id))
            return (
              <li
                key={r.id}
                className={`rounded-xl border p-4 transition ${
                  on
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
                      <Disc3 className="size-5 text-cyan-300" aria-hidden />
                    </div>
                    <div>
                      <div className="font-medium text-zinc-100">{r.name}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {new Date(r.addedAt).toLocaleString()}
                        {!ready ? ' · 解码中…' : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => toggleCustom(r.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        on
                          ? 'bg-white/15 text-white'
                          : 'bg-white/10 text-zinc-200 hover:bg-white/15'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {on ? '播放中' : '加入混音'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      删除
                    </button>
                  </div>
                </div>
                {on && ready ? (
                  <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        音量
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={L?.volume ?? 0.7}
                        onChange={(e) =>
                          setLayerField(tid, { volume: Number(e.target.value) })
                        }
                        className="ambient-range mt-1 w-full"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        立体声
                      </div>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.01}
                        value={L?.pan ?? 0}
                        onChange={(e) =>
                          setLayerField(tid, { pan: Number(e.target.value) })
                        }
                        className="ambient-range mt-1 w-full"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        倍速
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={1.6}
                        step={0.01}
                        value={L?.rate ?? 1}
                        onChange={(e) =>
                          setLayerField(tid, { rate: Number(e.target.value) })
                        }
                        className="ambient-range mt-1 w-full"
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
