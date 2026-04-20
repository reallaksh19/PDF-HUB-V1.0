import { create } from 'zustand';
import type { EditorState, ActiveTool } from './types';

export interface EditorActions {
  setActiveTool: (tool: ActiveTool) => void;
  setSidebarTab: (tab: string) => void;
  setInspectorTab: (tab: string) => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
}

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  activeTool: 'select',
  sidebarTab: 'thumbnails',
  inspectorTab: 'properties',
  leftPanelWidth: 250,
  rightPanelWidth: 300,
  setActiveTool: (activeTool) => set({ activeTool }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setLeftPanelWidth: (leftPanelWidth) => set({ leftPanelWidth }),
  setRightPanelWidth: (rightPanelWidth) => set({ rightPanelWidth }),
}));
