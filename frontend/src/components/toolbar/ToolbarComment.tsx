import React from 'react';
import {
  Type,
  Highlighter,
  Square,
  Stamp,
  MessageSquare,
  Undo,
  Redo,
  MoveRight,
  Minus,
  MessageCircle,
} from 'lucide-react';
import { useEditorStore } from '@/core/editor/store';
import { useAnnotationStore } from '@/core/annotations/store';
import { useSessionStore } from '@/core/session/store';
import type { ActiveTool } from '@/core/editor/types';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';

export const ToolbarComment: React.FC = () => {
  const { activeTool, setActiveTool } = useEditorStore();
  const {
    undo,
    redo,
    history,
    future,
    selectedAnnotationIds,
    copySelection,
    pasteClipboard,
    duplicateSelection,
    alignSelection,
    distributeSelection,
    deleteSelection,
  } = useAnnotationStore();

  const { viewState } = useSessionStore();
  const hasSelection = selectedAnnotationIds.length > 0;

  const handleToolClick = (
    tool: Exclude<ActiveTool, 'select' | 'hand'>,
  ) => {
    setActiveTool(activeTool === tool ? 'select' : tool);
  };

  const getToolVariant = (tool: string) =>
    activeTool === tool ? 'secondary' : 'ghost';

  return (
    <div className="flex items-center space-x-1 shrink-0" role="toolbar" aria-label="Annotation tools">
      <Tooltip content="Text Box">
        <Button variant={getToolVariant('textbox')} size="icon" onClick={() => handleToolClick('textbox')}>
          <Type className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Highlight">
        <Button variant={getToolVariant('highlight')} size="icon" onClick={() => handleToolClick('highlight')}>
          <Highlighter className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Shape">
        <Button variant={getToolVariant('shape')} size="icon" onClick={() => handleToolClick('shape')}>
          <Square className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Note">
        <Button variant={getToolVariant('comment')} size="icon" onClick={() => handleToolClick('comment')}>
          <MessageSquare className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Stamp">
        <Button variant={getToolVariant('stamp')} size="icon" onClick={() => handleToolClick('stamp')}>
          <Stamp className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Line">
        <Button variant={getToolVariant('line')} size="icon" onClick={() => handleToolClick('line')}>
          <Minus className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Arrow">
        <Button variant={getToolVariant('arrow')} size="icon" onClick={() => handleToolClick('arrow')}>
          <MoveRight className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Callout">
        <Button variant={getToolVariant('callout')} size="icon" onClick={() => handleToolClick('callout')}>
          <MessageCircle className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="sm" onClick={copySelection} disabled={!hasSelection}>
        Copy
      </Button>
      <Button variant="ghost" size="sm" onClick={() => pasteClipboard(viewState.currentPage)}>
        Paste
      </Button>
      <Button variant="ghost" size="sm" onClick={duplicateSelection} disabled={!hasSelection}>
        Duplicate
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="sm" onClick={() => alignSelection('left')} disabled={selectedAnnotationIds.length < 2}>
        Align L
      </Button>
      <Button variant="ghost" size="sm" onClick={() => alignSelection('top')} disabled={selectedAnnotationIds.length < 2}>
        Align T
      </Button>
      <Button variant="ghost" size="sm" onClick={() => distributeSelection('horizontal')} disabled={selectedAnnotationIds.length < 3}>
        Dist H
      </Button>
      <Button variant="ghost" size="sm" onClick={() => distributeSelection('vertical')} disabled={selectedAnnotationIds.length < 3}>
        Dist V
      </Button>
      <Button variant="ghost" size="sm" onClick={deleteSelection} disabled={!hasSelection}>
        Delete
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Tooltip content="Undo">
        <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0}>
          <Undo className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Redo">
        <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0}>
          <Redo className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};
