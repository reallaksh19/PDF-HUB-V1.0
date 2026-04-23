import React, { useState } from 'react';
import { useLoggerStore } from '@/core/logger/store';
import type { AppLogEntry } from '@/core/logger/types';

export const DebugPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'state' | 'performance' | 'system'>('logs');

  if (import.meta.env.PROD) {
    window.location.replace('/');
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 font-mono text-sm">
      <div className="flex items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h1 className="text-lg font-bold text-slate-100 mr-8">DocCraft Debug Console</h1>
        <div className="flex space-x-1">
          {['logs', 'state', 'performance', 'system'].map((tab) => (
            <button
              key={tab}
              role="tab"
              onClick={() => setActiveTab(tab as 'logs' | 'state' | 'performance' | 'system')}
              className={`px-4 py-1 rounded-sm capitalize ${
                activeTab === tab
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'state' && <div className="p-4">State placeholder</div>}
        {activeTab === 'performance' && <div className="p-4">Performance placeholder</div>}
        {activeTab === 'system' && <div className="p-4">System placeholder</div>}
      </div>
    </div>
  );
};

const LogsTab: React.FC = () => {
  const entries = useLoggerStore((state) => state.entries);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-1">
      {entries.map((entry: AppLogEntry) => (
        <div key={entry.id} data-testid="log-entry" className="flex items-start space-x-4 border-b border-slate-800/50 py-1 hover:bg-slate-800/30">
          <span className="text-slate-500 w-24 shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
          <span className={`w-16 shrink-0 uppercase text-xs font-bold ${
            entry.level === 'error' ? 'text-red-400' :
            entry.level === 'warn' ? 'text-amber-400' :
            entry.level === 'debug' ? 'text-slate-400' : 'text-blue-400'
          }`}>{entry.level}</span>
          <span className="w-24 shrink-0 text-purple-400">{entry.source}</span>
          <span className="text-slate-300 flex-1">{entry.message}</span>
        </div>
      ))}
      {entries.length === 0 && <div className="text-slate-500 italic">No logs recorded yet.</div>}
    </div>
  );
};
