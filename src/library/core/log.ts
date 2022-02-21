import {ScriptBowlEventContext} from '../@context';
import {ScriptLog} from '../script';

export async function getLogs(
  this: ScriptBowlEventContext,
  {
    from,
    to,
    reverse,
    offset,
  }: {
    from: number;
    to: number;
    reverse: boolean;
    offset: number;
  },
): Promise<ScriptLog[]> {
  return this.logger.getLogs(this.script!, {from, to, reverse, offset});
}
