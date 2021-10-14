import {ScriptBowlEventContext} from '../@context';
import {ScriptLog} from '../script';

export async function getLogs(
  this: ScriptBowlEventContext,
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
