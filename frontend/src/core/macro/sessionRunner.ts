import type { MacroRecipe } from './types';
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
  const { dispatchCommand } = await import('@/core/commands/dispatch');
  const result = await dispatchCommand({
    payload: { type: 'APPLY_MACRO', recipe, donorFiles },
    context: { source: 'macro-runner', timestamp: Date.now() },
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  if (options?.saveOutputs && result.extractedOutputs) {
    for (const output of result.extractedOutputs) {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
    }
  }

  // To preserve API compatibility where callers might expect `logs` or `selectedPages`
  return {
    workingBytes: result.workingBytes!,
    pageCount: result.pageCount!,
    selectedPages: [],
    logs: ['Macro executed via command bus'],
    extractedOutputs: result.extractedOutputs ?? [],
  };
}
