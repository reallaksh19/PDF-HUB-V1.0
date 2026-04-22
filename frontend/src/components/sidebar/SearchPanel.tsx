import React, { useEffect, useRef, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useSearchStore } from '@/core/search/store';
import { useSessionStore } from '@/core/session/store';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { Button } from '@/components/ui/Button';

export const SearchPanel: React.FC = () => {
  const {
    query,
    results,
    activeIndex,
    isSearching,
    setQuery,
    setResults,
    setActiveIndex,
    nextResult,
    previousResult,
    clearSearch,
    setSearching,
  } = useSearchStore();

  const { workingBytes, setPage } = useSessionStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    let cancelled = false;

    const performSearch = async () => {
      if (!workingBytes || !query) {
        if (results.length > 0) setResults([]);
        return;
      }

      setSearching(true);
      try {
        const hits = await PdfRendererAdapter.searchDocumentText(workingBytes, query);
        if (!cancelled) {
          setResults(hits);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    void performSearch();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingBytes, query, setResults, setSearching]);

  const groupedResults = useMemo(() => {
    const groups: Record<number, typeof results> = {};
    results.forEach((hit) => {
      if (!groups[hit.pageNumber]) {
        groups[hit.pageNumber] = [];
      }
      groups[hit.pageNumber].push(hit);
    });
    return groups;
  }, [results]);

  const handleResultClick = (index: number, pageNumber: number) => {
    setActiveIndex(index);
    setPage(pageNumber);
  };

  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      nextResult();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search document..."
            className="w-full h-9 pl-9 pr-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {query && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isSearching
                ? 'Searching...'
                : results.length > 0
                ? `${activeIndex !== null ? activeIndex + 1 : 0} of ${results.length} results`
                : 'No results found'}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={previousResult}
                disabled={results.length === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={nextResult}
                disabled={results.length === 0}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {Object.entries(groupedResults).map(([pageStr, hits]) => {
          const pageNumber = parseInt(pageStr, 10);
          return (
            <div key={pageNumber} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Page {pageNumber}
              </div>
              <div className="space-y-1">
                {hits.map((hit) => {
                  const index = results.indexOf(hit);
                  const isActive = activeIndex === index;
                  return (
                    <button
                      key={hit.id}
                      onClick={() => handleResultClick(index, pageNumber)}
                      className={`w-full text-left p-2 text-sm rounded-md border transition-colors ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="line-clamp-2">{hit.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
