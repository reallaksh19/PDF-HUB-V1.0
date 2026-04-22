import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Play,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { useSessionStore } from '@/core/session/store';
import { error as logError } from '@/core/logger/service';
import { BUILTIN_MACROS } from '@/core/macro/builtins';
import { runMacroRecipeAgainstSession } from '@/core/macro/sessionRunner';
import { useToastStore } from '@/core/toast/store';
import type {
  MacroOutputFile,
  MacroRecipe,
  MacroStep,
  PageSelector,
} from '@/core/macro/types';

type SelectorMode = 'selected' | 'current' | 'all' | 'range';
type BlankPlacement = 'before' | 'after';
type BlankSizeMode = 'match-current' | 'a4' | 'letter';

interface RecipeOverrides {
  selectorMode: SelectorMode;
  rangeFrom: number;
  rangeTo: number;
  rotateDegrees: 90 | 180 | 270;
  outputName: string;
  headerFooterText: string;
  headerFooterAlign: 'left' | 'center' | 'right';
  headerFooterMarginX: number;
  headerFooterMarginY: number;
  headerFooterFontSize: number;
  headerFooterColor: string;
  headerFooterOpacity: number;
  headerFooterPageToken: boolean;
  headerFooterFileToken: boolean;
  headerFooterDateToken: boolean;
  blankPlacement: BlankPlacement;
  blankSize: BlankSizeMode;
  blankCount: number;
}

interface OutputQueueItem extends MacroOutputFile {
  id: string;
}

const BUILTIN_RECIPES: MacroRecipe[] = Object.values(BUILTIN_MACROS);

const PLACEHOLDER_STEPS: Array<MacroStep['op']> = [
  'select_pages',
  'rotate_pages',
  'header_footer_text',
  'extract_pages',
];

export const MacrosSidebar: React.FC = () => {
  const { workingBytes, pageCount, viewState } = useSessionStore();
  const addToast = useToastStore((state) => state.addToast);
  const updateToast = useToastStore((state) => state.updateToast);
  const [selectedRecipeId, setSelectedRecipeId] = React.useState<string>(
    BUILTIN_RECIPES[0]?.id ?? '',
  );
  const selectedRecipe = React.useMemo(
    () => BUILTIN_RECIPES.find((recipe) => recipe.id === selectedRecipeId) ?? BUILTIN_RECIPES[0],
    [selectedRecipeId],
  );
  const [overridesByRecipe, setOverridesByRecipe] = React.useState<
    Record<string, RecipeOverrides>
  >({});
  const [isRunning, setIsRunning] = React.useState(false);
  const [runLogs, setRunLogs] = React.useState<string[]>([]);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [outputQueue, setOutputQueue] = React.useState<OutputQueueItem[]>([]);
  const overrides = React.useMemo(
    () =>
      selectedRecipe
        ? overridesByRecipe[selectedRecipe.id] ??
          createDefaultOverrides(selectedRecipe, Math.max(1, pageCount))
        : createDefaultOverrides(undefined, Math.max(1, pageCount)),
    [overridesByRecipe, pageCount, selectedRecipe],
  );

  const hasRotate = selectedRecipe?.steps.some((step) => step.op === 'rotate_pages') ?? false;
  const hasExtractOrSplit =
    selectedRecipe?.steps.some((step) => step.op === 'extract_pages' || step.op === 'split_pages') ??
    false;
  const hasHeaderFooter =
    selectedRecipe?.steps.some((step) => step.op === 'header_footer_text') ?? false;
  const hasBlankInsert =
    selectedRecipe?.steps.some((step) => step.op === 'insert_blank_page') ?? false;

  const updateOverrides = (patch: Partial<RecipeOverrides>) => {
    if (!selectedRecipe) {
      return;
    }
    setOverridesByRecipe((current) => ({
      ...current,
      [selectedRecipe.id]: {
        ...overrides,
        ...patch,
      },
    }));
  };

  const runSelectedMacro = async () => {
    if (!workingBytes || !selectedRecipe) {
      return;
    }

    setIsRunning(true);
    setRunError(null);

    const toastId = addToast({
      type: 'progress',
      title: `Running Macro: ${selectedRecipe.name}`,
      message: 'Processing document...',
      progress: 0,
    });

    try {
      const runtimeRecipe = applyOverridesToRecipe(
        selectedRecipe,
        overrides,
        viewState.currentPage,
        Math.max(1, pageCount),
      );

      const result = await runMacroRecipeAgainstSession(runtimeRecipe, {
        saveOutputs: false,
      });

      setRunLogs(result.logs);
      if (result.extractedOutputs.length > 0) {
        setOutputQueue((current) => [
          ...current,
          ...result.extractedOutputs.map((output) => ({
            id: uuidv4(),
            ...output,
          })),
        ]);
      }
      updateToast(toastId, {
        type: 'success',
        title: 'Macro Complete',
        message: `Generated ${result.extractedOutputs.length} output file(s).`,
        progress: undefined,
      });
    } catch (err) {
      const message = String(err);
      setRunError(message);
      logError('macro', 'Macro execution failed in sidebar', {
        recipeId: selectedRecipe.id,
        error: message,
      });
      updateToast(toastId, {
        type: 'error',
        title: 'Macro Failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
        progress: undefined,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetPanel = () => {
    if (!selectedRecipe) {
      return;
    }
    setOverridesByRecipe((current) => ({
      ...current,
      [selectedRecipe.id]: createDefaultOverrides(selectedRecipe, Math.max(1, pageCount)),
    }));
    setRunLogs([]);
    setRunError(null);
    setOutputQueue([]);
  };

  const saveOutput = async (id: string) => {
    const output = outputQueue.find((item) => item.id === id);
    if (!output) {
      return;
    }

    try {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
      setOutputQueue((items) => items.filter((item) => item.id !== id));
    } catch (err) {
      const message = String(err);
      setRunError(message);
      logError('macro', 'Failed to save macro output', {
        outputName: output.name,
        error: message,
      });
    }
  };

  const saveAllOutputs = async () => {
    for (const output of outputQueue) {
      try {
        await FileAdapter.savePdfBytes(output.bytes, output.name, null);
      } catch (err) {
        const message = String(err);
        setRunError(message);
        logError('macro', 'Failed to save all macro outputs', {
          outputName: output.name,
          error: message,
        });
        return;
      }
    }

    setOutputQueue([]);
  };

  if (!workingBytes) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm text-slate-500 dark:text-slate-400">
          Open a PDF to run macros.
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Sparkles className="w-4 h-4" />
          Built-in Recipes
        </div>

        <div className="grid grid-cols-1 gap-2">
          {BUILTIN_RECIPES.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setSelectedRecipeId(recipe.id)}
              className={`text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                selectedRecipe?.id === recipe.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {recipe.name}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Parameters
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500">Target pages</label>
          <select
            value={overrides.selectorMode}
            onChange={(event) =>
              updateOverrides({
                selectorMode: event.target.value as SelectorMode,
              })
            }
            className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="selected">Selected pages</option>
            <option value="current">Current page</option>
            <option value="all">All pages</option>
            <option value="range">Range</option>
          </select>
        </div>

        {overrides.selectorMode === 'range' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500">
              From
              <input
                type="number"
                min={1}
                max={Math.max(1, pageCount)}
                value={overrides.rangeFrom}
                onChange={(event) =>
                  updateOverrides({
                    rangeFrom: Number(event.target.value),
                  })
                }
                className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500">
              To
              <input
                type="number"
                min={1}
                max={Math.max(1, pageCount)}
                value={overrides.rangeTo}
                onChange={(event) =>
                  updateOverrides({
                    rangeTo: Number(event.target.value),
                  })
                }
                className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        )}

        {hasRotate && (
          <div className="space-y-2">
            <label className="text-xs text-slate-500">Rotate degrees</label>
            <select
              value={overrides.rotateDegrees}
              onChange={(event) =>
                updateOverrides({
                  rotateDegrees: Number(event.target.value) as 90 | 180 | 270,
                })
              }
              className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
            >
              <option value={90}>90</option>
              <option value={180}>180</option>
              <option value={270}>270</option>
            </select>
          </div>
        )}

        {hasExtractOrSplit && (
          <label className="text-xs text-slate-500 block">
            Output file name
            <input
              type="text"
              value={overrides.outputName}
              onChange={(event) =>
                updateOverrides({
                  outputName: event.target.value,
                })
              }
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
            />
          </label>
        )}

        {hasHeaderFooter && (
          <>
            <label className="text-xs text-slate-500 block">
              Header/Footer text
              <input
                type="text"
                value={overrides.headerFooterText}
                onChange={(event) =>
                  updateOverrides({
                    headerFooterText: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-500">
                Align
                <select
                  value={overrides.headerFooterAlign}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterAlign: event.target.value as 'left' | 'center' | 'right',
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Font size
                <input
                  type="number"
                  min={6}
                  max={72}
                  value={overrides.headerFooterFontSize}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterFontSize: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-500">
                Margin X
                <input
                  type="number"
                  min={0}
                  value={overrides.headerFooterMarginX}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterMarginX: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-slate-500">
                Margin Y
                <input
                  type="number"
                  min={0}
                  value={overrides.headerFooterMarginY}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterMarginY: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-500">
                Color
                <input
                  type="text"
                  value={overrides.headerFooterColor}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterColor: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-slate-500">
                Opacity
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={overrides.headerFooterOpacity}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterOpacity: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={overrides.headerFooterPageToken}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterPageToken: event.target.checked,
                    })
                  }
                />
                Page token
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={overrides.headerFooterFileToken}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterFileToken: event.target.checked,
                    })
                  }
                />
                File token
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={overrides.headerFooterDateToken}
                  onChange={(event) =>
                    updateOverrides({
                      headerFooterDateToken: event.target.checked,
                    })
                  }
                />
                Date token
              </label>
            </div>
          </>
        )}

        {hasBlankInsert && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-500">
                Position
                <select
                  value={overrides.blankPlacement}
                  onChange={(event) =>
                    updateOverrides({
                      blankPlacement: event.target.value as BlankPlacement,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                >
                  <option value="before">Before current</option>
                  <option value="after">After current</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Size
                <select
                  value={overrides.blankSize}
                  onChange={(event) =>
                    updateOverrides({
                      blankSize: event.target.value as BlankSizeMode,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                >
                  <option value="match-current">Match current</option>
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </label>
            </div>

            <label className="text-xs text-slate-500 block">
              Count
              <input
                type="number"
                min={1}
                max={20}
                value={overrides.blankCount}
                onChange={(event) =>
                  updateOverrides({
                    blankCount: Number(event.target.value),
                  })
                }
                className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
              />
            </label>
          </>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Run
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => void runSelectedMacro()} disabled={isRunning || !selectedRecipe}>
            {isRunning ? (
              <RotateCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            {isRunning ? 'Running' : 'Run Macro'}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetPanel}>
            Reset
          </Button>
        </div>

        {runError && (
          <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-2 py-1 text-xs">
            {runError}
          </div>
        )}

        <div className="space-y-1 max-h-32 overflow-auto rounded-md border border-slate-200 dark:border-slate-800 p-2">
          {runLogs.length === 0 && (
            <div className="text-xs text-slate-500">No run logs yet.</div>
          )}
          {runLogs.map((line) => (
            <div key={`${selectedRecipe?.id}-${line}`} className="text-xs text-slate-600 dark:text-slate-300">
              {line}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Output Queue
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void saveAllOutputs()}
              disabled={outputQueue.length === 0}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOutputQueue([])}
              disabled={outputQueue.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {outputQueue.length === 0 && (
          <div className="text-xs text-slate-500">No generated output files.</div>
        )}

        <div className="space-y-2">
          {outputQueue.map((output) => (
            <div key={output.id} className="rounded-md border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-700 dark:text-slate-200 truncate">{output.name}</div>
              <Button variant="ghost" size="sm" onClick={() => void saveOutput(output.id)}>
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Wrench className="w-4 h-4" />
          Custom Recipe Builder (Coming Soon)
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Custom step-by-step builder ships in next phase; use Built-ins now.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled>
            New Recipe
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Add Step
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Remove Step
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Run Custom
          </Button>
        </div>

        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500">
              <tr>
                <th className="text-left px-2 py-1.5">Step</th>
                <th className="text-left px-2 py-1.5">Operation</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_STEPS.map((operation, index) => (
                <tr key={operation} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-2 py-1.5">{index + 1}</td>
                  <td className="px-2 py-1.5 font-mono">{operation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

function createDefaultOverrides(recipe: MacroRecipe | undefined, pageCount: number): RecipeOverrides {
  const normalizedPageCount = Math.max(1, pageCount);

  if (!recipe) {
    return {
      selectorMode: 'selected',
      rangeFrom: 1,
      rangeTo: normalizedPageCount,
      rotateDegrees: 90,
      outputName: 'macro-output.pdf',
      headerFooterText: 'Page {page} of {pages}',
      headerFooterAlign: 'center',
      headerFooterMarginX: 24,
      headerFooterMarginY: 20,
      headerFooterFontSize: 10,
      headerFooterColor: '#475569',
      headerFooterOpacity: 0.9,
      headerFooterPageToken: true,
      headerFooterFileToken: false,
      headerFooterDateToken: false,
      blankPlacement: 'after',
      blankSize: 'match-current',
      blankCount: 1,
    };
  }

  const selectLikeStep = recipe.steps.find((step) => hasSelector(step));
  const selector = selectLikeStep ? selectorFromStep(selectLikeStep) : { mode: 'selected' as const };

  const rotateStep = recipe.steps.find((step) => step.op === 'rotate_pages');
  const outputStep = recipe.steps.find((step) => step.op === 'extract_pages' || step.op === 'split_pages');
  const headerFooterStep = recipe.steps.find((step) => step.op === 'header_footer_text');
  const blankInsertStep = recipe.steps.find((step) => step.op === 'insert_blank_page');

  return {
    selectorMode: selector.mode === 'range' || selector.mode === 'current' || selector.mode === 'all'
      ? selector.mode
      : 'selected',
    rangeFrom: selector.mode === 'range' ? selector.from : 1,
    rangeTo: selector.mode === 'range' ? selector.to : normalizedPageCount,
    rotateDegrees: rotateStep?.op === 'rotate_pages' ? rotateStep.degrees : 90,
    outputName:
      outputStep?.op === 'extract_pages' || outputStep?.op === 'split_pages'
        ? outputStep.outputName ?? `${recipe.id}.pdf`
        : `${recipe.id}.pdf`,
    headerFooterText:
      headerFooterStep?.op === 'header_footer_text'
        ? headerFooterStep.text
        : 'Page {page} of {pages}',
    headerFooterAlign:
      headerFooterStep?.op === 'header_footer_text' ? headerFooterStep.align : 'center',
    headerFooterMarginX:
      headerFooterStep?.op === 'header_footer_text' ? headerFooterStep.marginX : 24,
    headerFooterMarginY:
      headerFooterStep?.op === 'header_footer_text' ? headerFooterStep.marginY : 20,
    headerFooterFontSize:
      headerFooterStep?.op === 'header_footer_text' ? headerFooterStep.fontSize : 10,
    headerFooterColor:
      headerFooterStep?.op === 'header_footer_text'
        ? headerFooterStep.color ?? '#475569'
        : '#475569',
    headerFooterOpacity:
      headerFooterStep?.op === 'header_footer_text'
        ? headerFooterStep.opacity ?? 0.9
        : 0.9,
    headerFooterPageToken:
      headerFooterStep?.op === 'header_footer_text'
        ? headerFooterStep.pageNumberToken ?? true
        : true,
    headerFooterFileToken:
      headerFooterStep?.op === 'header_footer_text'
        ? headerFooterStep.fileNameToken ?? false
        : false,
    headerFooterDateToken:
      headerFooterStep?.op === 'header_footer_text'
        ? headerFooterStep.dateToken ?? false
        : false,
    blankPlacement:
      blankInsertStep?.op === 'insert_blank_page' && blankInsertStep.position.mode === 'before'
        ? 'before'
        : 'after',
    blankSize:
      blankInsertStep?.op === 'insert_blank_page' && typeof blankInsertStep.size === 'string'
        ? blankInsertStep.size
        : 'match-current',
    blankCount:
      blankInsertStep?.op === 'insert_blank_page' ? blankInsertStep.count ?? 1 : 1,
  };
}

function applyOverridesToRecipe(
  recipe: MacroRecipe,
  overrides: RecipeOverrides,
  currentPage: number,
  pageCount: number,
): MacroRecipe {
  const selector = toPageSelector(overrides, pageCount);

  const nextSteps = recipe.steps.map((step) => {
    switch (step.op) {
      case 'select_pages':
        return { ...step, selector };

      case 'extract_pages':
        return {
          ...step,
          selector,
          outputName: cleanOutputName(overrides.outputName, step.outputName),
        };

      case 'split_pages':
        return {
          ...step,
          selector,
          outputName: cleanOutputName(overrides.outputName, step.outputName),
        };

      case 'duplicate_pages':
      case 'rotate_pages':
      case 'remove_pages':
        return {
          ...step,
          selector,
          ...(step.op === 'rotate_pages' ? { degrees: overrides.rotateDegrees } : {}),
        };

      case 'header_footer_text':
        return {
          ...step,
          selector,
          text: overrides.headerFooterText,
          align: overrides.headerFooterAlign,
          marginX: overrides.headerFooterMarginX,
          marginY: overrides.headerFooterMarginY,
          fontSize: overrides.headerFooterFontSize,
          color: overrides.headerFooterColor,
          opacity: clamp(overrides.headerFooterOpacity, 0, 1),
          pageNumberToken: overrides.headerFooterPageToken,
          fileNameToken: overrides.headerFooterFileToken,
          dateToken: overrides.headerFooterDateToken,
        };

      case 'insert_blank_page':
        return {
          ...step,
          position: {
            mode: overrides.blankPlacement,
            page: currentPage,
          },
          size: overrides.blankSize,
          count: Math.max(1, overrides.blankCount),
        };

      default:
        return step;
    }
  });

  return {
    ...recipe,
    steps: nextSteps,
  };
}

function cleanOutputName(candidate: string, fallback: string | undefined): string | undefined {
  const normalized = candidate.trim();
  if (normalized.length > 0) {
    return normalized;
  }
  return fallback;
}

function hasSelector(step: MacroStep): boolean {
  return (
    step.op === 'select_pages' ||
    step.op === 'extract_pages' ||
    step.op === 'split_pages' ||
    step.op === 'duplicate_pages' ||
    step.op === 'rotate_pages' ||
    step.op === 'remove_pages' ||
    step.op === 'header_footer_text'
  );
}

function selectorFromStep(step: MacroStep): PageSelector {
  switch (step.op) {
    case 'select_pages':
    case 'extract_pages':
    case 'split_pages':
    case 'duplicate_pages':
    case 'rotate_pages':
    case 'remove_pages':
    case 'header_footer_text':
      return step.selector;
    default:
      return { mode: 'selected' };
  }
}

function toPageSelector(overrides: RecipeOverrides, pageCount: number): PageSelector {
  if (overrides.selectorMode === 'all') {
    return { mode: 'all' };
  }
  if (overrides.selectorMode === 'current') {
    return { mode: 'current' };
  }
  if (overrides.selectorMode === 'range') {
    const from = clamp(overrides.rangeFrom, 1, Math.max(1, pageCount));
    const to = clamp(overrides.rangeTo, 1, Math.max(1, pageCount));
    return { mode: 'range', from, to };
  }
  return { mode: 'selected' };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
