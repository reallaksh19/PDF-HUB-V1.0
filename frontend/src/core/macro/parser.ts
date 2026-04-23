import { MacroRecipe, MacroStep } from './types';

export function parseMacroRecipe(json: string): MacroRecipe {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON format for MacroRecipe');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('MacroRecipe must be an object');
  }

  if (typeof parsed.id !== 'string') {
    throw new Error('MacroRecipe.id must be a string');
  }

  if (typeof parsed.name !== 'string') {
    throw new Error('MacroRecipe.name must be a string');
  }

  if (!Array.isArray(parsed.steps)) {
    throw new Error('MacroRecipe.steps must be an array');
  }

  const parsedObject = parsed as { id: unknown; name: unknown; dryRun?: unknown; steps: unknown };

  if (typeof parsedObject.id !== 'string') {
    throw new Error('MacroRecipe.id must be a string');
  }

  if (typeof parsedObject.name !== 'string') {
    throw new Error('MacroRecipe.name must be a string');
  }

  if (!Array.isArray(parsedObject.steps)) {
    throw new Error('MacroRecipe.steps must be an array');
  }

  const steps: MacroStep[] = parsedObject.steps.map((step: unknown, index: number) => {
    if (typeof step !== 'object' || step === null || typeof (step as Record<string, unknown>).op !== 'string') {
      throw new Error(`Invalid step at index ${index}: missing or invalid 'op'`);
    }

    const stepRecord = step as Record<string, unknown>;

    // Basic validation of specific ops added in Phase 2
    if (stepRecord.op === 'insert_image') {
      if (typeof stepRecord.donorFileId !== 'string') throw new Error(`Step ${index} (insert_image): missing donorFileId`);
      if (typeof stepRecord.x !== 'number') throw new Error(`Step ${index} (insert_image): missing x`);
      if (typeof stepRecord.y !== 'number') throw new Error(`Step ${index} (insert_image): missing y`);
      if (typeof stepRecord.width !== 'number') throw new Error(`Step ${index} (insert_image): missing width`);
      if (typeof stepRecord.height !== 'number') throw new Error(`Step ${index} (insert_image): missing height`);
    }

    if (stepRecord.op === 'inject_rich_text') {
       if (typeof stepRecord.html !== 'string') throw new Error(`Step ${index} (inject_rich_text): missing html`);
       if (typeof stepRecord.x !== 'number') throw new Error(`Step ${index} (inject_rich_text): missing x`);
       if (typeof stepRecord.y !== 'number') throw new Error(`Step ${index} (inject_rich_text): missing y`);
       if (typeof stepRecord.width !== 'number') throw new Error(`Step ${index} (inject_rich_text): missing width`);
       if (typeof stepRecord.height !== 'number') throw new Error(`Step ${index} (inject_rich_text): missing height`);
    }

    return step as MacroStep;
  });

  return {
    id: parsedObject.id,
    name: parsedObject.name,
    dryRun: !!parsedObject.dryRun,
    steps,
  };
}
