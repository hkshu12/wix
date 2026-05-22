import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { ThemeProvider } from '../theme/ThemeProvider';

interface Options extends RenderOptions {
  routerProps?: MemoryRouterProps;
  withTheme?: boolean;
}

function TestProviders({
  children,
  routerProps,
  withTheme
}: {
  children: ReactNode;
  routerProps?: MemoryRouterProps;
  withTheme: boolean;
}) {
  const routed = <MemoryRouter {...routerProps}>{children}</MemoryRouter>;
  return withTheme ? <ThemeProvider>{routed}</ThemeProvider> : routed;
}

export function renderWithRouter(ui: ReactElement, options: Options = {}) {
  const { routerProps, withTheme = true, ...renderOptions } = options;
  return render(
    <TestProviders routerProps={routerProps} withTheme={withTheme}>
      {ui}
    </TestProviders>,
    renderOptions
  );
}
