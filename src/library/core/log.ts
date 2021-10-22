import {ScriptBowlEventContext} from '../@context';
import {ScriptLog} from '../script';

export async function getLogs(
  this: ScriptBowlEventContext,
  {
    from,
    to,
    reverse,
  }: {
    from: number;
    to: number;
    reverse?: boolean;
  },
): Promise<ScriptLog[]> {
  return this.logger.getLogs(this.script!, from, to, reverse);
}
