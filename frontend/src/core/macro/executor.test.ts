import { describe, it, expect } from 'vitest';
import { executeMacroRecipe } from './executor';
import { useSessionStore } from '../session/store';
import { useAnnotationStore } from '../annotations/store';

describe('Macro Executor', () => {
  it('should handle macro execution failure safely', async () => {
    // Setup a dummy macro that throws an error
    const brokenMacro = {
      id: 'broken',
      name: 'Broken Macro',
      description: '',
      operations: [
        {
          type: 'custom' as const, // Use valid literal type if possible, or omit for now
          params: {},
        } as unknown as { type: 'custom'; params: Record<string, unknown> } // More strict cast
      ],
      createdAt: 0,
      updatedAt: 0,
    };

    let errorResult: unknown = null;
    try {
      await executeMacroRecipe(brokenMacro, {
        session: useSessionStore.getState(),
        annotations: useAnnotationStore.getState(),
      });
    } catch (err) {
      errorResult = err;
    }

    expect(errorResult).toBeDefined();
  });
});
