import React, { useState, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sun, Moon, Settings, Search, X } from 'lucide-react';
import { useSearchStore } from '@/core/search/store';
import { useSessionStore } from '@/core/session/store';
import { useEditorStore } from '@/core/editor/store';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';

export const TopNav: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { workingBytes } = useSessionStore();
  const { setSidebarTab, setLeftPanelWidth, leftPanelWidth } = useEditorStore();
  const {
    query,
    setQuery,
    setHits,
    clearSearch,
    nextHit,
    setIsSearching
  } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<number | null>(null);

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
      // Ignore
    } finally {
      setIsSearching(false);
    }
  }, [workingBytes, clearSearch, setIsSearching, setHits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setQuery('');
      clearSearch();
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      setQuery(value);
      executeSearch(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (leftPanelWidth < 1) {
        setLeftPanelWidth(20);
      }
      setSidebarTab('search');

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      if (localQuery.trim()) {
        if (localQuery === query) {
          nextHit();
        } else {
          setQuery(localQuery);
          executeSearch(localQuery);
        }
      }
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    clearSearch();
  };

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-sm"></div>
          <span className="font-bold text-lg hidden sm:inline-block">DocCraft</span>
          <Badge data-testid="mode-badge" variant="success" className="ml-2">
            STATIC
          </Badge>
        </div>

        <div className="hidden md:flex space-x-1 pl-4 ml-4 border-l border-slate-200 dark:border-slate-800">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            Workspace
          </NavLink>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={localQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search document..."
            className="h-9 w-48 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <Button data-testid="theme-toggle" variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};