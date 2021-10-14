import {ScriptBowlEventContext} from '../@context';

export async function remove(this: ScriptBowlEventContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  try {
    await this.fc.deleteTrigger(serviceName, scriptId, scriptId);
  } catch (error) {}

  await this.fc.deleteFunction(serviceName, scriptId);

  return true;
}
