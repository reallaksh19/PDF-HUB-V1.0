export type ActiveTool =
  | 'select'
  | 'hand'
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'rectangle'
  | 'ellipse'
  | 'freehand'
  | 'stamp'
  | 'comment'
  | 'line'
  | 'arrow'
  | 'callout';

export type SidebarTab =
  | 'thumbnails'
  | 'bookmarks'
  | 'comments'
  | 'search'
  | 'macros';

export type InspectorTab = 'properties' | 'style' | 'metadata';
export type RibbonTab = 'file' | 'organize' | 'annotate' | 'macro' | 'view';

export interface EditorState {
  activeTool: ActiveTool;
  sidebarTab: SidebarTab;
  inspectorTab: InspectorTab;
  activeRibbonTab: RibbonTab;
  leftPanelWidth: number;
  rightPanelWidth: number;
}
