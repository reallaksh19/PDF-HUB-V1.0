import { DocumentCommand, CommandSource, CommandContext, CommandResult } from './types';
export const executeCommand = async (command: DocumentCommand, source: CommandSource, context?: CommandContext): Promise<CommandResult> => {
  console.log('Dummy execute', command, source, context);
  return { success: true };
};
