import React, { useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSearchStore } from '@/core/search/store';
import { useSessionStore } from '@/core/session/store';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { Button } from '@/components/ui/Button';

export const SearchPanel: React.FC = () => {
  const { workingBytes, setPage } = useSessionStore();
  const {
    query,
    setQuery,
    hits,
    setHits,
    activeHitId,
    setActiveHit,
    clearSearch,
    nextHit,
    prevHit,
    isSearching,
    setIsSearching
  } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(query);

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setLocalQuery(query);
  }

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!workingBytes) return;
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    try {
      const results = await PdfRendererAdapter.searchDocumentText(workingBytes, searchQuery);
      setHits(results);
    } catch {
      // Ignore error
    } finally {
      setIsSearching(false);
    }
  }, [workingBytes, clearSearch, setIsSearching, setHits]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (localQuery === query) {
        // If query hasn't changed, Enter should go to next hit
        nextHit();
      } else {
        setQuery(localQuery);
        executeSearch(localQuery);
      }
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
  };

  const handleHitClick = (hitId: string, pageNumber: number) => {
    setActiveHit(hitId);
    setPage(pageNumber);
  };

  const groupedHits = hits.reduce((acc, hit) => {
    if (!acc[hit.pageNumber]) acc[hit.pageNumber] = [];
    acc[hit.pageNumber].push(hit);
    return acc;
  }, {} as Record<number, typeof hits>);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={localQuery}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search in document..."
            className="w-full h-9 pl-8 pr-8 text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {localQuery && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {hits.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{hits.length} result{hits.length !== 1 ? 's' : ''}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevHit}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextHit}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {isSearching && (
          <div className="text-sm text-slate-500 text-center py-4">Searching...</div>
        )}

        {!isSearching && query && hits.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-4">No results found.</div>
        )}

        {!isSearching && Object.entries(groupedHits).map(([pageStr, pageHits]) => {
          const pageNum = parseInt(pageStr, 10);
          return (
            <div key={pageNum} className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 pl-2">
                Page {pageNum}
              </div>
              {pageHits.map((hit) => {
                const isActive = hit.id === activeHitId;
                return (
                  <button
                    key={hit.id}
                    onClick={() => handleHitClick(hit.id, pageNum)}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    {hit.snippet}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
