import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { useMixerStore } from '../store/mixerStore'

const ACCEPT = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm'

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const importSound = useMixerStore((s) => s.importSound)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name)) {
        await importSound(file)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] py-4 text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] transition-colors"
      >
        <Upload size={18} />
        导入自定义音频（持久化存储）
      </button>
    </>
  )
}
