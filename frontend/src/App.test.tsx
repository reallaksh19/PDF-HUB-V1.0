import { render, screen } from '@testing-library/react';
import App from './App';
import * as capabilitiesHook from '@/core/capabilities/useCapabilities';
import { vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@/core/capabilities/useCapabilities');
vi.mock('react-resizable-panels', () => ({
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Group: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Separator: () => <div></div>,
}));

test('renders Workspace page by default', () => {
  vi.spyOn(capabilitiesHook, 'useCapabilities').mockReturnValue({
    mode: 'server',
    canOpenLocalFile: true,
    canMergeFiles: true,
    canSplitFile: true,
    canRunPreviewOcr: false,
    canRunServerOcr: true,
    canRunMacroApi: true,
    serverVersion: '0.1.0',
    serverLatencyMs: 10,
  });

  render(<App />);
  expect(screen.getByText(/Open a PDF to begin/i)).toBeInTheDocument();
});
