import React from 'react';
import {
  PanelLeft,
  Sparkles,
  Hash,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { useEditorStore } from '@/core/editor/store';
import { useSessionStore } from '@/core/session/store';
import { BUILTIN_MACROS } from '@/core/macro/builtins';
import { runMacroRecipeAgainstSession } from '@/core/macro/sessionRunner';
import { error as logError } from '@/core/logger/service';

export const ToolbarMacro: React.FC = () => {
  const { setSidebarTab } = useEditorStore();
  const { workingBytes } = useSessionStore();
  const [runningRecipeId, setRunningRecipeId] = React.useState<string | null>(null);

  const runRecipe = async (recipeId: keyof typeof BUILTIN_MACROS) => {
    if (!workingBytes) {
      return;
    }

    const recipe = BUILTIN_MACROS[recipeId];
    if (!recipe) {
      return;
    }

    setRunningRecipeId(recipe.id);
    try {
      await runMacroRecipeAgainstSession(recipe, { saveOutputs: false });
      setSidebarTab('macros');
    } catch (err) {
      logError('macro', 'Quick macro run from ribbon failed', {
        recipeId: recipe.id,
        error: String(err),
      });
    } finally {
      setRunningRecipeId(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Open macro panel">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSidebarTab('macros')}
          className="h-8"
        >
          <PanelLeft className="w-4 h-4 mr-1" />
          Macro Panel
        </Button>
      </Tooltip>

      <Tooltip content="Rotate selected pages by 90 degrees">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void runRecipe('rotate_selected_90')}
          disabled={!workingBytes || runningRecipeId !== null}
          className="h-8"
        >
          {runningRecipeId === 'rotate_selected_90' ? (
            <RotateCw className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RotateCw className="w-4 h-4 mr-1" />
          )}
          Rotate 90
        </Button>
      </Tooltip>

      <Tooltip content="Add page numbers to footer">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void runRecipe('add_page_numbers_footer')}
          disabled={!workingBytes || runningRecipeId !== null}
          className="h-8"
        >
          <Hash className="w-4 h-4 mr-1" />
          Page Numbers
        </Button>
      </Tooltip>

      <Tooltip content="Open built-in macro recipes">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarTab('macros')}
          className="h-8"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Built-ins
        </Button>
      </Tooltip>
    </div>
  );
};
