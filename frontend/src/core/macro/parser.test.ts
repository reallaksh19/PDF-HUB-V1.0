import { describe, it, expect } from 'vitest';
import { parseMacroRecipe } from './parser';

describe('Macro Parser', () => {
  it('should parse valid json into a MacroRecipe', () => {
    const json = JSON.stringify({
      id: 'test-1',
      name: 'Test Recipe',
      steps: [
        {
          op: 'insert_image',
          donorFileId: 'logo',
          selector: { mode: 'all' },
          x: 10,
          y: 10,
          width: 100,
          height: 50,
        }
      ]
    });

    const recipe = parseMacroRecipe(json);
    expect(recipe.id).toBe('test-1');
    expect(recipe.steps).toHaveLength(1);
    expect(recipe.steps[0].op).toBe('insert_image');
  });

  it('should throw an error for missing required image props', () => {
    const json = JSON.stringify({
      id: 'test-2',
      name: 'Test Recipe',
      steps: [
        {
          op: 'insert_image',
          donorFileId: 'logo',
        }
      ]
    });

    expect(() => parseMacroRecipe(json)).toThrowError(/missing x/);
  });
});
