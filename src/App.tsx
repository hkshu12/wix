import { Waves } from 'lucide-react'
import { BuiltInSection } from './components/BuiltInSection'
import { CustomTracksSection } from './components/CustomTracksSection'
import { MasterSection } from './components/MasterSection'
import { MixerAudioBridge } from './hooks/useMixerAudioBridge'

export default function App() {
  return (
    <>
      <MixerAudioBridge />
      <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-6 px-4 py-6 pb-16 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-200/90">
              <Waves className="size-3.5" aria-hidden />
              Web · PWA · Android（Capacitor）
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ambient 混音台
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              多轨叠加、独立音量与声像、倍速与母线音色控制。内置程序化雨声、海边、篝火与壁炉等纹理；导入的音频保存在本机，可离线回放。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-zinc-400 sm:max-w-xs">
            点击任意声卡即可开始播放（浏览器需要一次手势解锁 Web
            Audio）。安装到主屏幕即可获得 PWA 体验。
          </div>
        </header>

        <MasterSection />
        <BuiltInSection />
        <CustomTracksSection />

        <footer className="text-center text-xs text-zinc-600">
          程序化音景由 Web Audio 实时合成 · 导入文件版权归你所有
        </footer>
      </div>
    </>
  )
}
