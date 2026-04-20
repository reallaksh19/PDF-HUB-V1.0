import React, { useState } from 'react';
import { useEditorStore } from '@/core/editor/store';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';
import { Layers, Bookmark, MessageSquare, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const SidebarPanel: React.FC = () => {
  const { sidebarTab, leftPanelWidth, setLeftPanelWidth } = useEditorStore();
  const [previousWidth, setPreviousWidth] = useState(20);

  const isCollapsed = leftPanelWidth < 5;

  const toggleCollapse = () => {
    if (isCollapsed) {
      setLeftPanelWidth(previousWidth < 15 ? 20 : previousWidth);
    } else {
      setPreviousWidth(leftPanelWidth);
      setLeftPanelWidth(0);
    }
  };

  const getPanelTitle = () => {
    switch (sidebarTab) {
      case 'thumbnails': return 'Pages';
      case 'bookmarks': return 'Bookmarks';
      case 'comments': return 'Comments';
      case 'search': return 'Search';
      case 'ocr-jobs': return 'OCR Jobs';
      default: return 'Panel';
    }
  };

  if (isCollapsed) {
    return (
      <div className="absolute top-4 left-4 z-10" style={{ transform: 'translateX(3rem)' }}>
        <Button 
          data-testid="sidebar-collapse-btn"
          variant="secondary" 
          size="icon" 
          onClick={toggleCollapse}
          className="shadow-md rounded-full h-8 w-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {getPanelTitle()}
        </h2>
        <Button 
          data-testid="sidebar-collapse-btn"
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 -mr-2" 
          onClick={toggleCollapse}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto relative">
        {sidebarTab === 'thumbnails' && <FeaturePlaceholder name="Thumbnails" description="Page previews will appear here." icon={<Layers />} />}
        {sidebarTab === 'bookmarks' && <FeaturePlaceholder name="Bookmarks" description="Document bookmarks will appear here." icon={<Bookmark />} />}
        {sidebarTab === 'comments' && <FeaturePlaceholder name="Comments" description="Document comments and reviews will appear here." icon={<MessageSquare />} />}
        {sidebarTab === 'search' && <FeaturePlaceholder name="Search" description="Search results will appear here." icon={<Search />} />}
        {sidebarTab === 'ocr-jobs' && <FeaturePlaceholder name="OCR Jobs" description="Status of ongoing and past OCR jobs." icon={<FileText />} />}
      </div>
    </div>
  );
};
