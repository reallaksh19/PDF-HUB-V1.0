import React from 'react';
import { useCapabilities } from '@/core/capabilities/useCapabilities';
import { Badge } from '@/components/ui/Badge';
import { useSessionStore } from '@/core/session/store';

export const StatusBar: React.FC = () => {
  const capabilities = useCapabilities();
  const { isDirty, viewState, pageCount, setZoom } = useSessionStore();
  const isServer = capabilities?.mode === 'server';
  const zoomSteps = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Find closest preset zoom step to the slider value
    const val = parseInt(e.target.value, 10);
    const closest = zoomSteps.reduce((prev, curr) => 
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );
    setZoom(closest);
  };

  return (
    <div className="flex items-center justify-between px-4 h-8 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 z-10 shrink-0">
      <div className="flex items-center space-x-4">
        <span>DocCraft {isServer ? (capabilities?.serverVersion || 'v0.1.0') : 'Preview'}</span>
        {isDirty && (
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <span className="font-mono">Page: {pageCount > 0 ? `${viewState.currentPage} / ${pageCount}` : '— / —'}</span>
        <div className="flex items-center space-x-2">
          <span className="font-mono w-12 text-right">{viewState.zoom}%</span>
          <input 
            type="range" 
            min="25" 
            max="400" 
            step="1"
            value={viewState.zoom} 
            onChange={handleZoomChange}
            className="w-24 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
          />
        </div>
        <Badge 
          variant={isServer ? 'success' : 'warning'} 
          className="text-[10px] px-1.5 py-0 h-4 min-h-4 leading-none inline-flex items-center"
        >
          {isServer ? 'SERVER' : 'PREVIEW'}
        </Badge>
      </div>
    </div>
  );
};
