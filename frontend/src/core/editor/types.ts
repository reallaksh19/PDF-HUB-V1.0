export type ActiveTool = 'select' | 'hand' | 'textbox' | 'highlight' | 'underline' | 'shape' | 'freehand' | 'stamp' | 'comment';
export type SidebarTab = 'thumbnails' | 'bookmarks' | 'comments' | 'search' | 'ocr-jobs';
export type InspectorTab = 'properties' | 'style' | 'metadata';

export interface EditorState {
  activeTool: ActiveTool;
  sidebarTab: SidebarTab;
  inspectorTab: InspectorTab;
  leftPanelWidth: number;
  rightPanelWidth: number;
}
