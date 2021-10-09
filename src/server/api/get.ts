import {APIContext, ScriptClientDocument} from '../services';

export async function get(
  this: APIContext,
): Promise<ScriptClientDocument | undefined> {
  return this.scriptServices.get(this.script!);
}
