type SliderRowProps = {
  label: string
  hint?: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

export function SliderRow({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: SliderRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-100">{label}</div>
          {hint ? <div className="text-xs text-zinc-500">{hint}</div> : null}
        </div>
        <div className="tabular-nums text-xs text-cyan-300/90">
          {format ? format(value) : value.toFixed(2)}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ambient-range w-full"
      />
    </div>
  )
}
