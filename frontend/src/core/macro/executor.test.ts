import { describe, it, expect } from 'vitest';
import { executeMacroRecipe } from './executor';

describe('Macro Executor', () => {
  it('should be defined', () => {
    expect(executeMacroRecipe).toBeDefined();
  });
});
