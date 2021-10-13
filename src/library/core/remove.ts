import {ScriptContext} from '../@context';

export async function remove(this: ScriptContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  try {
    await this.fc.deleteTrigger(serviceName, scriptId, scriptId);
  } catch (error) {}

  await this.fc.deleteFunction(serviceName, scriptId);
  return true;
}
