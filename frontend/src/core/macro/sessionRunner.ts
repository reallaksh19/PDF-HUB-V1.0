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

  // Import dynamically or explicitly to use dispatcher but macro executor might do multiple steps
  // A cleaner approach: since executor produces the final bytes, we can push a manual history state
  // or wrap it in a macro command if we had one. Wait, we can push history state manually or dispatch a generic REPLACE command.
  // Wait! The dispatchCommand doesn't have a generic REPLACE_ALL. Let's just push history manually, then call replaceWorkingCopy.
  import('@/core/document-history/store').then(({ useHistoryStore }) => {
    useHistoryStore.getState().push({
      id: crypto.randomUUID(),
      command: { type: 'MERGE_PDF', additionalBytes: [] }, // Dummy command for macro or we could add MACRO command
      timestamp: Date.now(),
      before: { bytes: session.workingBytes!, pageCount: session.pageCount },
      after: { bytes: result.workingBytes, pageCount: result.pageCount }
    });
    useSessionStore.getState().replaceWorkingCopy(result.workingBytes, result.pageCount);
    useSessionStore.getState().setSelectedPages(result.selectedPages);
  });

  if (options?.saveOutputs) {
    for (const output of result.extractedOutputs) {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
    }
  }

  return result;
}
