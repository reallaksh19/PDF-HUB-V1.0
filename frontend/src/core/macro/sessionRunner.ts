import type { MacroRecipe } from './types';
import { executeMacroRecipe } from './executor';
import { useSessionStore } from '@/core/session/store';
import { FileAdapter } from '@/adapters/file/FileAdapter';

export async function runMacroRecipeAgainstSession(
  recipe: MacroRecipe,
  options?: {
    donorFiles?: Record<string, Uint8Array>;
    saveOutputs?: boolean;
  },
) {
  const session = useSessionStore.getState();

  if (!session.workingBytes || !session.fileName) {
    throw new Error('No active document in session');
  }

  const donorFiles = options?.donorFiles ?? {};
  const result = await executeMacroRecipe(
    {
      workingBytes: session.workingBytes,
      pageCount: session.pageCount,
      selectedPages: session.selectedPages,
      currentPage: session.viewState.currentPage,
      fileName: session.fileName,
      donorFiles,
      now: new Date(),
    },
    recipe,
  );

  if (!recipe.dryRun) {
    useSessionStore.getState().replaceWorkingCopy(result.workingBytes, result.pageCount);
    useSessionStore.getState().setSelectedPages(result.selectedPages);
  }

  if (!recipe.dryRun && options?.saveOutputs) {
    for (const output of result.extractedOutputs) {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
    }
  }

  return result;
}
