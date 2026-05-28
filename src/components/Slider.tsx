interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Called when the user finishes adjusting (pointer up, touch end, or key up). */
  onCommit?: (value: number) => void;
}

export function Slider({ label, value, min, max, onChange, onCommit }: SliderProps) {
  function commitFromEvent(event: { currentTarget: HTMLInputElement }) {
    onCommit?.(Number(event.currentTarget.value));
  }

  return (
    <label className="slider-row">
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        onKeyUp={onCommit ? commitFromEvent : undefined}
        onPointerUp={onCommit ? commitFromEvent : undefined}
        onTouchEnd={onCommit ? commitFromEvent : undefined}
      />
      <output>{value}</output>
    </label>
  );
}
