// A stub while waiting for A1 to deliver
import { DocumentCommand } from './types';
export async function dispatchCommand(command: DocumentCommand) {
  // eslint-disable-next-line no-console
  console.log('Dispatching command', command);
}
