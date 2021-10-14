import {ScriptBowlEventContext} from '../@context';

export async function get(
  this: ScriptBowlEventContext,
): Promise<any | undefined> {
  return this.fc.getFunction(this.serviceName, this.script!);
}
