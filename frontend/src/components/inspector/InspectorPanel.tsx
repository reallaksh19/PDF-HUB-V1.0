import React, { useState } from 'react';
import { useEditorStore } from '@/core/editor/store';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';
import { Settings, Palette, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const InspectorPanel: React.FC = () => {
  const { inspectorTab, setInspectorTab, rightPanelWidth, setRightPanelWidth } = useEditorStore();
  const [previousWidth, setPreviousWidth] = useState(300);

  const isCollapsed = rightPanelWidth < 5;

  const toggleCollapse = () => {
    if (isCollapsed) {
      setRightPanelWidth(previousWidth < 15 ? 20 : previousWidth);
    } else {
      setPreviousWidth(rightPanelWidth);
      setRightPanelWidth(0);
    }
  };

  if (isCollapsed) {
    return (
      <div className="absolute top-4 right-4 z-10">
        <Button 
          data-testid="inspector-collapse-btn"
          variant="secondary" 
          size="icon" 
          onClick={toggleCollapse}
          className="shadow-md rounded-full h-8 w-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'properties', icon: Settings, label: 'Properties' },
    { id: 'style', icon: Palette, label: 'Style' },
    { id: 'metadata', icon: Info, label: 'Metadata' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Inspector
        </h2>
        <Button 
          data-testid="inspector-collapse-btn"
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 -mr-2" 
          onClick={toggleCollapse}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-md w-full">
          {tabs.map((tab) => {
            const isActive = inspectorTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setInspectorTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-sm transition-colors ${
                  isActive 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={tab.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto relative">
        {inspectorTab === 'properties' && <FeaturePlaceholder name="Properties" description="Object properties will appear here." icon={<Settings />} />}
        {inspectorTab === 'style' && <FeaturePlaceholder name="Style" description="Styling options will appear here." icon={<Palette />} />}
        {inspectorTab === 'metadata' && <FeaturePlaceholder name="Metadata" description="Document metadata will appear here." icon={<Info />} />}
      </div>
    </div>
  );
};
