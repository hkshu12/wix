# UI Redesign (Landing + Studio + Themes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single-page mixer into a marketing landing route (`/`), a focused studio route (`/studio`), and a persisted light/dark/system theme — while preserving mixer state and audio engine behavior across navigation.

**Architecture:** Add `react-router-dom` with an `AppLayout` parent that owns mixer/audio state and renders `<Outlet />`. Landing uses cold-load-only redirect when `wix.hasEnteredStudio` is set; studio links back with router `state` so intro navigation is not bounced. Theme preference resolves to `data-theme` on `<html>` via CSS variables in `tokens.css`.

**Tech Stack:** React 19, Vite 8, Vitest + Testing Library, react-router-dom, existing `AudioEngine` / `domain/mixer` / `storage/customLibrary`.

**Spec:** `docs/superpowers/specs/2026-05-22-ui-redesign-design.md`

---

## File map (before tasks)

| File | Responsibility |
|------|----------------|
| `src/storage/onboarding.ts` | `hasEnteredStudio` read/write |
| `src/theme/resolveTheme.ts` | Pure `system \| light \| dark` → effective theme |
| `src/theme/ThemeProvider.tsx` | Context, `localStorage`, `matchMedia` listener |
| `src/theme/ThemeToggle.tsx` | 跟随系统 / 浅色 / 深色 UI |
| `src/theme/tokens.css` | Semantic CSS variables for light & dark |
| `src/layout/StudioContext.tsx` | Context type + hook for studio state/actions |
| `src/layout/AppLayout.tsx` | Mixer state, `AudioEngine`, custom tracks, `<Outlet />` |
| `src/pages/LandingPage.tsx` | Hero + 3 sections + footer |
| `src/pages/LandingPage.css` | Landing-only layout |
| `src/pages/StudioPage.tsx` | Top bar + catalog + mixer (from current `App.tsx`) |
| `src/pages/StudioPage.css` | Studio layout (from current `App.css`) |
| `src/components/Slider.tsx` | Shared slider (extracted from `App.tsx`) |
| `src/router/AppRouter.tsx` | Routes, landing gate, layout |
| `src/main.tsx` | `BrowserRouter` + `ThemeProvider` + `AppRouter` |
| `src/App.test.tsx` | Update to router + studio assertions |
| `src/pages/LandingPage.test.tsx` | Landing CTA + no stat grid on studio |
| `src/router/landingGate.test.tsx` | Redirect + `fromIntro` state |
| `index.html` | Optional dynamic `theme-color` via small inline script or React effect |

**Remove / shrink:** `src/App.tsx` (delete after extraction), `src/App.css` (split into files above).

---

### Task 1: Dependencies and router test harness

**Files:**
- Modify: `package.json`
- Modify: `src/test/setup.ts` (if needed for `localStorage` reset)

- [ ] **Step 1: Install react-router-dom**

```bash
cd /workspace && npm install react-router-dom
```

- [ ] **Step 2: Add test helper for routed renders**

Create `src/test/renderWithRouter.tsx`:

```tsx
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { ThemeProvider } from '../theme/ThemeProvider';

interface Options extends RenderOptions {
  routerProps?: MemoryRouterProps;
}

export function renderWithRouter(ui: React.ReactElement, options: Options = {}) {
  const { routerProps, ...renderOptions } = options;
  return render(
    <ThemeProvider>
      <MemoryRouter {...routerProps}>{ui}</MemoryRouter>
    </ThemeProvider>,
    renderOptions
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/test/renderWithRouter.tsx
git commit -m "chore: add react-router-dom and test router helper"
```

---

### Task 2: Onboarding storage

**Files:**
- Create: `src/storage/onboarding.ts`
- Create: `src/storage/onboarding.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/storage/onboarding.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { getHasEnteredStudio, markEnteredStudio, STORAGE_KEY_ENTERED_STUDIO } from './onboarding';

describe('onboarding storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns false when unset', () => {
    expect(getHasEnteredStudio()).toBe(false);
  });

  it('returns true after markEnteredStudio', () => {
    markEnteredStudio();
    expect(getHasEnteredStudio()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY_ENTERED_STUDIO)).toBe('1');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm run test -- src/storage/onboarding.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/storage/onboarding.ts
export const STORAGE_KEY_ENTERED_STUDIO = 'wix.hasEnteredStudio';

export function getHasEnteredStudio(): boolean {
  return localStorage.getItem(STORAGE_KEY_ENTERED_STUDIO) === '1';
}

export function markEnteredStudio(): void {
  localStorage.setItem(STORAGE_KEY_ENTERED_STUDIO, '1');
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm run test -- src/storage/onboarding.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/storage/onboarding.ts src/storage/onboarding.test.ts
git commit -m "feat: add onboarding localStorage helpers"
```

---

### Task 3: Theme resolver (pure functions)

**Files:**
- Create: `src/theme/resolveTheme.ts`
- Create: `src/theme/resolveTheme.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  resolveEffectiveTheme,
  type ThemePreference
} from './resolveTheme';

describe('resolveEffectiveTheme', () => {
  it('forces light', () => {
    expect(resolveEffectiveTheme('light', false)).toBe('light');
    expect(resolveEffectiveTheme('light', true)).toBe('light');
  });

  it('forces dark', () => {
    expect(resolveEffectiveTheme('dark', true)).toBe('dark');
  });

  it('follows system preference', () => {
    expect(resolveEffectiveTheme('system', false)).toBe('light');
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test -- src/theme/resolveTheme.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/theme/resolveTheme.ts
export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export const STORAGE_KEY_THEME = 'wix.themePreference';

export function readThemePreference(): ThemePreference {
  const raw = localStorage.getItem(STORAGE_KEY_THEME);
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return 'system';
}

export function resolveEffectiveTheme(
  preference: ThemePreference,
  prefersDark: boolean
): EffectiveTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return prefersDark ? 'dark' : 'light';
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/theme/resolveTheme.ts src/theme/resolveTheme.test.ts
git commit -m "feat: add theme preference resolver"
```

---

### Task 4: Theme tokens CSS

**Files:**
- Create: `src/theme/tokens.css`
- Modify: `src/main.tsx` (import tokens globally)

- [ ] **Step 1: Add tokens (light + dark on `html[data-theme]`)**

```css
/* src/theme/tokens.css */
:root {
  color-scheme: light dark;
}

html[data-theme='light'] {
  --bg: #f8fafc;
  --bg-elevated: #ffffff;
  --text: #0f172a;
  --text-muted: #475569;
  --border: rgba(15, 23, 42, 0.12);
  --accent: #0284c7;
  --accent-soft: #38bdf8;
  --accent-gradient: linear-gradient(135deg, #0284c7, #7c3aed 55%, #db2777);
  --shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  --page-gradient: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 45%, #f8fafc 100%);
  --panel-bg: rgba(255, 255, 255, 0.86);
  --slider-accent: #0284c7;
}

html[data-theme='dark'] {
  --bg: #020617;
  --bg-elevated: #0f172a;
  --text: #f8fafc;
  --text-muted: #94a3b8;
  --border: rgba(148, 163, 184, 0.2);
  --accent: #38bdf8;
  --accent-soft: #7dd3fc;
  --accent-gradient: linear-gradient(135deg, #38bdf8, #a78bfa 55%, #fb7185);
  --shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
  --page-gradient: linear-gradient(135deg, #07111f 0%, #101827 45%, #07121f 100%);
  --panel-bg: rgba(15, 23, 42, 0.74);
  --slider-accent: #7dd3fc;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  color: var(--text);
  background: var(--page-gradient);
}
```

- [ ] **Step 2: Import in `src/main.tsx`**

```tsx
import './theme/tokens.css';
```

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens.css src/main.tsx
git commit -m "feat: add light and dark CSS theme tokens"
```

---

### Task 5: ThemeProvider and ThemeToggle

**Files:**
- Create: `src/theme/ThemeProvider.tsx`
- Create: `src/theme/ThemeToggle.tsx`

- [ ] **Step 1: Implement ThemeProvider**

```tsx
// src/theme/ThemeProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  readThemePreference,
  resolveEffectiveTheme,
  STORAGE_KEY_THEME,
  type EffectiveTheme,
  type ThemePreference
} from './resolveTheme';

interface ThemeContextValue {
  preference: ThemePreference;
  effective: EffectiveTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const effective = resolveEffectiveTheme(preference, systemDark);

  useEffect(() => {
    document.documentElement.dataset.theme = effective;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', effective === 'dark' ? '#07111f' : '#f8fafc');
    }
  }, [effective]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    localStorage.setItem(STORAGE_KEY_THEME, next);
  }, []);

  const value = useMemo(
    () => ({ preference, effective, setPreference }),
    [preference, effective, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Implement ThemeToggle**

```tsx
// src/theme/ThemeToggle.tsx
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
    <div className="theme-toggle" role="group" aria-label={`主题，当前为${effective === 'dark' ? '深色' : '浅色'}`}>
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
```

- [ ] **Step 3: Add minimal toggle styles to `src/theme/tokens.css` (end of file)**

```css
.theme-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
  border: 1px solid var(--border);
}

.theme-toggle button {
  border: 0;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
}

.theme-toggle button.active {
  color: var(--text);
  background: var(--bg-elevated);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/theme/ThemeProvider.tsx src/theme/ThemeToggle.tsx src/theme/tokens.css
git commit -m "feat: add theme provider and toggle control"
```

---

### Task 6: StudioContext + AppLayout (lift audio state)

**Files:**
- Create: `src/layout/StudioContext.tsx`
- Create: `src/layout/AppLayout.tsx`

- [ ] **Step 1: Move mixer/audio logic from `src/App.tsx` into `AppLayout.tsx`**

Copy these responsibilities from current `App.tsx` into `AppLayout`:
- `mixer` / `setMixer` state
- `customTracks`, `importStatus`, `engineRef`, `customTracksRef`
- `allSounds`, `selectedLayers` memos
- `replaceCustomTracks`, `getAudioEngine`, `useEffect` for `listCustomTracks` and `engine.sync`
- handlers: `handleImport`, `handleDeleteCustomTrack`, `handlePlayToggle`

Expose via context:

```tsx
// src/layout/StudioContext.tsx
import { createContext, useContext, type ReactNode } from 'react';
import type { MixerState } from '../domain/mixer';
import type { CustomTrack } from '../storage/customLibrary';
import type { PlayableSound } from '../audio/audioGraphPlan';

export interface StudioContextValue {
  mixer: MixerState;
  setMixer: React.Dispatch<React.SetStateAction<MixerState>>;
  customTracks: CustomTrack[];
  importStatus: string;
  allSounds: PlayableSound[];
  selectedLayers: Array<{ layer: MixerState['layers'][number]; sound: PlayableSound }>;
  handleImport: (files: FileList | null) => Promise<void>;
  handleDeleteCustomTrack: (track: CustomTrack) => Promise<void>;
  handlePlayToggle: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ value, children }: { value: StudioContextValue; children: ReactNode }) {
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within AppLayout');
  return ctx;
}
```

`AppLayout.tsx` skeleton:

```tsx
import { Outlet } from 'react-router-dom';
import { StudioProvider, type StudioContextValue } from './StudioContext';
// ...imports from current App.tsx...

export function AppLayout() {
  // all state/effects/handlers from App.tsx
  const studioValue: StudioContextValue = { mixer, setMixer, customTracks, importStatus, allSounds, selectedLayers, handleImport, handleDeleteCustomTrack, handlePlayToggle };
  return (
    <StudioProvider value={studioValue}>
      <Outlet />
    </StudioProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles (layout only)**

```bash
npx tsc -b --pretty false 2>&1 | head -20
```

Fix import paths until clean.

- [ ] **Step 3: Commit**

```bash
git add src/layout/StudioContext.tsx src/layout/AppLayout.tsx
git commit -m "feat: lift mixer and audio engine state into AppLayout"
```

---

### Task 7: Landing page

**Files:**
- Create: `src/pages/LandingPage.tsx`
- Create: `src/pages/LandingPage.css`

- [ ] **Step 1: Implement landing content (Chinese copy per spec)**

Sections:
1. `<header>` with `ThemeToggle` + optional link to repo
2. `<main>` hero: `h1` 白噪音混音器, one-line 价值主张, CTA **开始使用**
3. Section **能做什么** — bullet list (4 items from spec)
4. Section **怎么用** — 3 steps + second CTA
5. Section **使用场景与平台** — browser / PWA / Android plain language
6. `<footer>` optional version from `package.json` via `import pkg from '../../package.json'` only if `resolveJsonModule` enabled; otherwise hardcode `1.0.0` or omit.

CTA handler:

```tsx
import { useNavigate } from 'react-router-dom';
import { markEnteredStudio } from '../storage/onboarding';

function StartButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="landing-cta"
      onClick={() => {
        markEnteredStudio();
        navigate('/studio');
      }}
    >
      开始使用
    </button>
  );
}
```

- [ ] **Step 2: Style landing in `LandingPage.css` using `var(--*)` tokens**

Marketing-friendly spacing; no stat cards; no English eyebrows.

- [ ] **Step 3: Commit**

```bash
git add src/pages/LandingPage.tsx src/pages/LandingPage.css
git commit -m "feat: add marketing landing page"
```

---

### Task 8: Studio page (extract UI)

**Files:**
- Create: `src/pages/StudioPage.tsx`
- Create: `src/pages/StudioPage.css`
- Create: `src/components/Slider.tsx`

- [ ] **Step 1: Extract `Slider` to `src/components/Slider.tsx`** (copy from current `App.tsx` lines 291–314)

- [ ] **Step 2: Build `StudioPage.tsx`**

Top bar (`studio-topbar`):
- App title **白噪音混音器** (or use `/icon.svg` 24px)
- `handlePlayToggle` button (开始播放 / 暂停播放)
- Import label (same hidden file input pattern)
- Link/button **介绍** → `navigate('/', { state: { fromIntro: true } })`
- `ThemeToggle`
- Compact `importStatus` text in bar or directly under bar

Body: copy `studio-grid`, `catalog-panel`, `mixer-panel`, `sound-grid`, `layer-card` JSX from `App.tsx` — **omit** `hero-panel`, `heroStats`, `hero-card`.

Use `useStudio()` from context for all data/handlers.

- [ ] **Step 3: Migrate styles from `App.css` to `StudioPage.css`**

Replace hard-coded colors with tokens, e.g.:

```css
.panel {
  background: var(--panel-bg);
  border: 1px solid var(--border);
  color: var(--text);
}
.primary-action {
  background: var(--accent-gradient);
}
.slider-row input {
  accent-color: var(--slider-accent);
}
```

Keep existing responsive breakpoints (`980px`, `640px`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/StudioPage.tsx src/pages/StudioPage.css src/components/Slider.tsx
git commit -m "feat: add studio page with slim toolbar and mixer UI"
```

---

### Task 9: Router, landing gate, wire entry

**Files:**
- Create: `src/router/AppRouter.tsx`
- Create: `src/router/landingGate.test.tsx`
- Modify: `src/main.tsx`
- Delete: `src/App.tsx`, `src/App.css`

- [ ] **Step 1: Write failing landing gate tests**

```tsx
// src/router/landingGate.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { markEnteredStudio } from '../storage/onboarding';
import { LandingGate } from './AppRouter';

function LandingStub() {
  return <div>Landing content</div>;
}

describe('LandingGate', () => {
  beforeEach(() => localStorage.clear());

  it('redirects cold load to studio when already entered', async () => {
    markEnteredStudio();
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingGate landing={<LandingStub />} />} />
            <Route path="/studio" element={<div>Studio</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByText('Studio')).toBeInTheDocument());
  });

  it('does not redirect when opened from intro navigation state', async () => {
    markEnteredStudio();
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[{ pathname: '/', state: { fromIntro: true } }]}>
          <Routes>
            <Route path="/" element={<LandingGate landing={<LandingStub />} />} />
            <Route path="/studio" element={<div>Studio</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getByText('Landing content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement `AppRouter.tsx`**

```tsx
import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { StudioPage } from '../pages/StudioPage';
import { getHasEnteredStudio } from '../storage/onboarding';

export function LandingGate({ landing }: { landing: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromIntro = (location.state as { fromIntro?: boolean } | null)?.fromIntro === true;

  useEffect(() => {
    if (!fromIntro && getHasEnteredStudio()) {
      navigate('/studio', { replace: true });
    }
  }, [fromIntro, navigate]);

  if (!fromIntro && getHasEnteredStudio()) {
    return null;
  }

  return <>{landing}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<LandingGate landing={<LandingPage />} />}
        />
        <Route path="/studio" element={<StudioPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 3: Update `main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { ThemeProvider } from './theme/ThemeProvider';
import { AppRouter } from './router/AppRouter';
import './theme/tokens.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
```

- [ ] **Step 4: Delete `src/App.tsx` and `src/App.css`**

- [ ] **Step 5: Run landing gate tests**

```bash
npm run test -- src/router/landingGate.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/router src/main.tsx
git rm src/App.tsx src/App.css
git commit -m "feat: add client routes with cold-load landing redirect"
```

---

### Task 10: Update and add component tests

**Files:**
- Modify: `src/App.test.tsx` → rename to `src/pages/StudioPage.test.tsx` (or keep path and update imports)
- Create: `src/pages/LandingPage.test.tsx`

- [ ] **Step 1: Studio tests (migrate from `App.test.tsx`)**

```tsx
import { renderWithRouter } from '../test/renderWithRouter';
import { markEnteredStudio } from '../storage/onboarding';
// render <AppRouter /> with initialEntries={['/studio']}
// after markEnteredStudio() or direct /studio entry

it('renders studio without marketing stat grid', () => {
  renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });
  expect(screen.queryByLabelText('应用能力概览')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument();
});
```

- [ ] **Step 2: Landing CTA test**

```tsx
it('marks entered studio and navigates on 开始使用', async () => {
  renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/'] } });
  fireEvent.click(screen.getByRole('button', { name: '开始使用' }));
  await waitFor(() => expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument());
  expect(getHasEnteredStudio()).toBe(true);
});
```

- [ ] **Step 3: Run full test suite**

```bash
npm run test
```

Expected: all tests PASS (15 existing + new).

- [ ] **Step 4: Commit**

```bash
git add src/pages/*.test.tsx src/test/renderWithRouter.tsx
git rm src/App.test.tsx 2>/dev/null || true
git commit -m "test: cover landing CTA, studio shell, and landing redirect gate"
```

---

### Task 11: PWA manifest and final verification

**Files:**
- Modify: `vite.config.ts` (optional `start_url` stays `/`)
- Modify: `index.html` (`lang`, remove static `theme-color` if React updates it)

- [ ] **Step 1: Confirm PWA `start_url` is `/` (first-time landing still works)**

No change required unless product wants `/studio` — spec says `/`.

- [ ] **Step 2: Run verification commands**

```bash
npm ci
npm run lint
npm run test
npm run build
```

Expected: exit code 0 for all.

- [ ] **Step 3: Manual smoke (dev server)**

```bash
npm run dev
```

Checklist:
- First visit `/` shows landing; **开始使用** → `/studio`
- Reload `/` with flag set → redirects to `/studio`
- Studio **介绍** → landing visible (no bounce)
- Theme toggle: 浅色 / 深色 / 跟随系统 updates page colors
- Play + layer selection still works

- [ ] **Step 4: Commit any manifest/html tweaks**

```bash
git commit -am "chore: align PWA and theme-color with effective theme"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Landing `/` with hero + 3 sections | Task 7 |
| Studio `/studio` without marketing | Task 8 |
| First-visit + `hasEnteredStudio` | Task 2, 7, 9 |
| Intro link no auto-bounce | Task 9 (`fromIntro` state) |
| Theme light/dark/system + persistence | Task 3–5 |
| Theme on landing + studio | Task 7, 8 |
| State preserved across routes | Task 6 |
| Chinese-primary copy | Task 7, 8 |
| Tests for redirect, theme, CTA | Task 2–3, 10, 9 |
| Slim studio toolbar | Task 8 |

## Optional follow-ups (out of scope)

- Merge icon branch assets into studio header (already on separate PR).
- Android `npm run android:sync` after build (no WebView route changes needed).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-22-ui-redesign.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement tasks in this session with checkpoints  

Which approach do you want?
