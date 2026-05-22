import { useEffect } from 'react'
import type { BuiltInId } from '../audio/builtins'
import { getCustomBuffer } from '../audio/customBufferCache'
import {
  mixerEngine,
  parseBuiltinTrackId,
  parseCustomTrackId,
} from '../audio/MixerEngine'
import { useMixerStore } from '../stores/mixerStore'

/** Keeps Web Audio graph aligned with mixer store */
export function MixerAudioBridge() {
  const layers = useMixerStore((s) => s.layers)
  const masterVolume = useMixerStore((s) => s.masterVolume)
  const toneBrightness = useMixerStore((s) => s.toneBrightness)
  const globalRate = useMixerStore((s) => s.globalRate)
  const setAudioReady = useMixerStore((s) => s.setAudioReady)
  const assetGeneration = useMixerStore((s) => s.assetGeneration)

  useEffect(() => {
    mixerEngine.setMasterVolume(masterVolume)
  }, [masterVolume])

  useEffect(() => {
    mixerEngine.setMasterToneBrightness(toneBrightness)
  }, [toneBrightness])

  useEffect(() => {
    mixerEngine.setGlobalPlaybackRate(globalRate)
  }, [globalRate])

  useEffect(() => {
    const anyOn = Object.values(layers).some((l) => l.on)
    if (!anyOn) {
      for (const id of mixerEngine.getTrackIds()) {
        mixerEngine.removeTrack(id)
      }
      return
    }

    void (async () => {
      try {
        await mixerEngine.unlock()
        setAudioReady(true)
      } catch {
        return
      }

      const wanted = new Set<string>()
      for (const [tid, layer] of Object.entries(layers)) {
        if (!layer.on) continue
        wanted.add(tid)

        if (mixerEngine.hasTrack(tid)) {
          mixerEngine.setTrackVolume(tid, layer.volume)
          mixerEngine.setTrackPan(tid, layer.pan)
          mixerEngine.setTrackPlaybackRate(tid, layer.rate)
          continue
        }

        const bid = parseBuiltinTrackId(tid) as BuiltInId | undefined
        const cid = parseCustomTrackId(tid)
        if (bid) {
          mixerEngine.addBuiltIn(bid, layer.volume, layer.pan, layer.rate)
        } else if (cid) {
          const buf = getCustomBuffer(cid)
          if (buf) {
            mixerEngine.addCustom(cid, buf, layer.volume, layer.pan, layer.rate)
          }
        }
      }

      for (const existing of mixerEngine.getTrackIds()) {
        if (!wanted.has(existing)) {
          mixerEngine.removeTrack(existing)
        }
      }
    })()
  }, [layers, setAudioReady, assetGeneration])

  return null
}
