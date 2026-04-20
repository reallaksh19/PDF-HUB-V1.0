import React from 'react';
import { Button } from '@/components/ui/Button';
import { ZoomIn, ZoomOut, Expand, Maximize, MousePointer2, Hand } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useEditorStore } from '@/core/editor/store';
import { useSessionStore } from '@/core/session/store';

export const ToolbarView: React.FC = () => {
  const { activeTool, setActiveTool } = useEditorStore();
  const { viewState, setZoom } = useSessionStore();

  const zoomSteps = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  const handleZoomOut = () => {
    const nextZoom = zoomSteps.slice().reverse().find(step => step < viewState.zoom) || 25;
    setZoom(nextZoom);
  };

  const handleZoomIn = () => {
    const nextZoom = zoomSteps.find(step => step > viewState.zoom) || 400;
    setZoom(nextZoom);
  };

  return (
    <div className="flex items-center space-x-1 ml-auto border-l border-slate-200 dark:border-slate-800 pl-2">
      <Tooltip content="Select Text">
        <Button 
          variant={activeTool === 'select' ? 'secondary' : 'ghost'} 
          size="icon" className="h-8 w-8"
          onClick={() => setActiveTool('select')}
        >
          <MousePointer2 className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Hand Tool">
        <Button 
          variant={activeTool === 'hand' ? 'secondary' : 'ghost'} 
          size="icon" className="h-8 w-8 mr-4"
          onClick={() => setActiveTool('hand')}
        >
          <Hand className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Zoom Out (Ctrl+Minus)">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={viewState.zoom <= 25}>
          <ZoomOut className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <div className="w-16 text-center text-xs font-medium">{viewState.zoom}%</div>
      
      <Tooltip content="Zoom In (Ctrl+Plus)">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={viewState.zoom >= 400}>
          <ZoomIn className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Fit Width">
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
          <Expand className="w-4 h-4" />
        </Button>
      </Tooltip>
      
      <Tooltip content="Fit Page">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Maximize className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};
