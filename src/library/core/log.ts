import {ScriptContext} from '../@context';
import {ScriptLog} from '../script';

export async function getLogs(
  this: ScriptContext,
  {
    from,
    to,
  }: {
    from: number;
    to: number;
  },
): Promise<ScriptLog[]> {
  return this.logger.getLogs(this.script!, from, to);
}
