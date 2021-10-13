import {ScriptContext} from '../@context';

export async function get(this: ScriptContext): Promise<any | undefined> {
  return this.fc.getFunction(this.serviceName, this.script!);
}
