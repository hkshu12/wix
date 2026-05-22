import { useTheme } from './ThemeProvider';
import type { ThemePreference } from './resolveTheme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' }
];

export function ThemeToggle() {
  const { preference, effective, setPreference } = useTheme();

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label={`主题，当前为${effective === 'dark' ? '深色' : '浅色'}`}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={preference === option.value ? 'active' : ''}
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
