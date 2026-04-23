import { create } from 'zustand';
import type {
  ActiveTool,
  EditorState,
  InspectorTab,
  RibbonTab,
  SidebarTab,
} from './types';

export interface EditorActions {
  setActiveTool: (tool: ActiveTool) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setActiveRibbonTab: (tab: RibbonTab) => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
}

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  activeTool: 'select',
  sidebarTab: 'thumbnails',
  inspectorTab: 'properties',
  activeRibbonTab: 'file',
  leftPanelWidth: 20,
  rightPanelWidth: 18,
  setActiveTool: (activeTool) => set({ activeTool }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setActiveRibbonTab: (activeRibbonTab) => set({ activeRibbonTab }),
  setLeftPanelWidth: (leftPanelWidth) => set({ leftPanelWidth }),
  setRightPanelWidth: (rightPanelWidth) => set({ rightPanelWidth }),
}));
