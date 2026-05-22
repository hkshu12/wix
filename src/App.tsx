import { useEffect } from 'react'
import { Waves } from 'lucide-react'
import { MasterControls } from './components/MasterControls'
import { PresetBar } from './components/PresetBar'
import { ImportButton } from './components/ImportButton'
import { SleepTimer } from './components/SleepTimer'
import { SoundGrid } from './components/SoundGrid'
import { useMixerStore } from './store/mixerStore'

function App() {
  const init = useMixerStore((s) => s.init)
  const customLoaded = useMixerStore((s) => s.customLoaded)
  const activeCount = useMixerStore((s) =>
    Object.values(s.tracks).filter((t) => t.active).length,
  )

  useEffect(() => {
    void init()
  }, [init])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/30 to-cyan-600/20 border border-teal-500/20">
              <Waves className="text-[var(--color-accent)]" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Ambient Mix</h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                {activeCount > 0 ? `${activeCount} 轨混音中` : '多轨白噪音混合播放器'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 pb-32 space-y-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            场景预设
          </h2>
          <PresetBar />
        </section>

        {customLoaded && <SoundGrid />}

        <ImportButton />
        <SleepTimer />

        <p className="text-center text-xs text-[var(--color-text-muted)] pb-4">
          Web · PWA · Android 同构 · 数据本地持久化
        </p>
      </main>

      <MasterControls />
    </div>
  )
}

export default App
