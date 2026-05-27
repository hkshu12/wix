import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../router/AppRouter';
import { getHasEnteredStudio } from '../storage/onboarding';
import { renderWithRouter } from '../test/renderWithRouter';

describe('LandingPage', () => {
  it('lists sleep timer, presets, and mix persistence in features', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/'] } });

    expect(screen.getByRole('heading', { name: '能做什么' })).toBeInTheDocument();
    expect(screen.getByText(/睡眠定时/)).toBeInTheDocument();
    expect(screen.getByText(/场景预设/)).toBeInTheDocument();
    expect(screen.getByText(/刷新后自动恢复/)).toBeInTheDocument();
  });

  it('marks entered studio and navigates on 开始使用', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/'] } });

    fireEvent.click(screen.getAllByRole('button', { name: '开始使用' })[0]);

    await waitFor(() => expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument());
    expect(getHasEnteredStudio()).toBe(true);
  });
});
