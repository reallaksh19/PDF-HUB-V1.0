import React from 'react';
import type { ReactNode } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useEditorStore } from '@/core/editor/store';

interface AppShellProps {
  topnav: ReactNode;
  toolbar: ReactNode;
  leftRail: ReactNode;
  sidebar: ReactNode;
  workspace: ReactNode;
  inspector: ReactNode;
  statusbar: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  topnav,
  toolbar,
  leftRail,
  sidebar,
  workspace,
  inspector,
  statusbar,
}) => {
  const { leftPanelWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth } = useEditorStore();

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden">
      <div data-testid="top-nav" className="shrink-0">{topnav}</div>
      <div data-testid="toolbar-band" className="shrink-0">{toolbar}</div>

      <div className="flex-1 flex overflow-hidden">
        <div data-testid="left-rail" className="shrink-0">{leftRail}</div>
        
        <PanelGroup orientation="horizontal" className="flex-1">
          <Panel 
            defaultSize={leftPanelWidth} 
            minSize={15} 
            maxSize={40}
            onResize={(size) => setLeftPanelWidth(typeof size === 'number' ? size : 250)}
            id="sidebar" 
            className="flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"
          >
            <div data-testid="sidebar-panel" className="h-full w-full">{sidebar}</div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors cursor-col-resize" />

          <Panel id="workspace" className="flex flex-col bg-slate-100 dark:bg-slate-950/50">
            <div data-testid="document-workspace" className="h-full w-full">{workspace}</div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors cursor-col-resize" />

          <Panel 
            defaultSize={rightPanelWidth} 
            minSize={15} 
            maxSize={40}
            onResize={(size) => setRightPanelWidth(typeof size === 'number' ? size : 300)}
            id="inspector" 
            className="flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
          >
            <div data-testid="inspector-panel" className="h-full w-full">{inspector}</div>
          </Panel>
        </PanelGroup>
      </div>

      <div data-testid="status-bar" className="shrink-0">{statusbar}</div>
    </div>
  );
};
