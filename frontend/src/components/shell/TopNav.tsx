import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sun, Moon, Settings, Search } from 'lucide-react';
import { useSearchStore } from '@/core/search/store';
import { useEditorStore } from '@/core/editor/store';

export const TopNav: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { query, setQuery, nextResult } = useSearchStore();
  const { setSidebarTab, setLeftPanelWidth, leftPanelWidth } = useEditorStore();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value) {
      setSidebarTab('search');
      if (leftPanelWidth <= 0.1) {
        setLeftPanelWidth(20);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      nextResult();
    }
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
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search document..."
            className="h-9 w-48 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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