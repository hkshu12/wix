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
