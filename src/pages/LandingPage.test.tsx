import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../router/AppRouter';
import { getHasEnteredStudio } from '../storage/onboarding';
import { renderWithRouter } from '../test/renderWithRouter';

describe('LandingPage', () => {
  it('marks entered studio and navigates on 开始使用', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/'] } });

    fireEvent.click(screen.getAllByRole('button', { name: '开始使用' })[0]);

    await waitFor(() => expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument());
    expect(getHasEnteredStudio()).toBe(true);
  });
});
