export type DocumentCommand = { type: string; payload?: any };
export type CommandSource = 'ui' | 'shortcut' | 'macro';
export type CommandContext = { [key: string]: any };
export type CommandResult = { success: boolean; error?: Error };
