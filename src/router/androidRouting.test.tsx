import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AppRouter } from './AppRouter';

vi.mock('../lib/platform', () => ({
  shouldShowLandingPage: () => false,
  isAndroidApp: () => true,
  getAppPlatform: () => 'android'
}));

vi.mock('../layout/UpdateContext', async () => {
  const actual = await vi.importActual<typeof import('../layout/UpdateContext')>('../layout/UpdateContext');
  return {
    ...actual,
    useAppUpdate: () => ({
      phase: 'idle',
      currentVersion: '1.3.0',
      latestRelease: null,
      updateAvailable: false,
      errorMessage: null,
      downloadProgress: null,
      downloadedApkUri: null,
      checkForUpdates: vi.fn(),
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn()
    })
  };
});

describe('Android routing', () => {
  it('redirects root to studio without landing content', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRouter />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('heading', { level: 2, name: '夏雨' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '开始使用' })).not.toBeInTheDocument();
  });
});
