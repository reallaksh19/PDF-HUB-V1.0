import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThumbnailSidebar from './ThumbnailSidebar';
import { useSessionStore } from '@/core/session/store';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';

vi.mock('virtua', () => ({
  VList: ({ children, data }: any) => (
    <div data-testid="vlist">
      {data.map((item: any) => children(item))}
    </div>
  ),
}));

vi.mock('@/core/session/store', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('@/adapters/pdf-renderer/PdfRendererAdapter', () => ({
  PdfRendererAdapter: {
    loadDocument: vi.fn(),
    getThumbnail: vi.fn(),
  },
}));

vi.mock('@/adapters/pdf-edit/PdfEditAdapter', () => ({
  PdfEditAdapter: {
    movePage: vi.fn(),
    countPages: vi.fn(),
  },
}));

describe('ThumbnailSidebar', () => {
  it('handles keyboard navigation and selection', async () => {
    const mockSetPage = vi.fn();
    const mockSetSelectedPages = vi.fn();

    (useSessionStore as any).mockReturnValue({
      workingBytes: new Uint8Array([1, 2, 3]),
      viewState: { currentPage: 1 },
      setPage: mockSetPage,
      replaceWorkingCopy: vi.fn(),
      selectedPages: [],
      setSelectedPages: mockSetSelectedPages,
      toggleSelectedPage: vi.fn(),
    });

    let mockDocDeferredResolve: any;
    const mockDocPromise = new Promise((resolve) => {
        mockDocDeferredResolve = resolve;
    });

    const mockDoc = {
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({}),
      destroy: vi.fn(),
    };
    (PdfRendererAdapter.loadDocument as any).mockReturnValue(mockDocPromise);
    (PdfRendererAdapter.getThumbnail as any).mockResolvedValue('mock-url');

    render(<ThumbnailSidebar />);

    // Trigger load
    mockDocDeferredResolve(mockDoc);

    await vi.waitFor(() => {
        expect(screen.queryByText(/Generating thumbnails.../i)).not.toBeInTheDocument();
    });

    const thumbnails = screen.getAllByRole('button');
    expect(thumbnails).toHaveLength(2);

    // Test Enter to select
    fireEvent.keyDown(thumbnails[0], { key: 'Enter' });
    expect(mockSetPage).toHaveBeenCalledWith(1);
    expect(mockSetSelectedPages).toHaveBeenCalledWith([1]);

    // Focus mock for ArrowDown
    const nextThumb = thumbnails[1];
    nextThumb.focus = vi.fn();
    document.getElementById = vi.fn().mockReturnValue(nextThumb);

    fireEvent.keyDown(thumbnails[0], { key: 'ArrowDown' });
    expect(nextThumb.focus).toHaveBeenCalled();
  });
});
