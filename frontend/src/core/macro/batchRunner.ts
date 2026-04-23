import type { MacroRecipe } from './types';
import { executeMacroRecipe } from './executor';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { FileAdapter } from '@/adapters/file/FileAdapter';

export async function runMacroRecipeAcrossFiles(
  recipe: MacroRecipe,
  files: Array<{ name: string; bytes: Uint8Array }>,
  options: {
    saveOutputs: boolean;
    suffix: string;
  },
) {
  const results: Array<{
    inputName: string;
    outputName: string;
    bytes: Uint8Array;
    logs: string[];
  }> = [];

  for (const file of files) {
    const pageCount = await PdfEditAdapter.countPages(file.bytes);
    const run = await executeMacroRecipe(
      {
        workingBytes: file.bytes,
        pageCount,
        selectedPages: [],
        currentPage: 1,
        fileName: file.name,
        donorFiles: {},
        now: new Date(),
      },
      recipe,
    );

    const baseName = stripPdfExt(file.name);
    const outputName = `${baseName}${options.suffix}.pdf`;

    if (options.saveOutputs) {
      await FileAdapter.savePdfBytes(run.workingBytes, outputName, null);
      for (const output of run.extractedOutputs) {
        await FileAdapter.savePdfBytes(
          output.bytes,
          `${baseName}-${output.name}`,
          null,
        );
      }
    }

    results.push({
      inputName: file.name,
      outputName,
      bytes: run.workingBytes,
      logs: run.logs,
    });
  }

  return results;
}

function stripPdfExt(name: string): string {
  return name.toLowerCase().endsWith('.pdf') ? name.slice(0, -4) : name;
}
