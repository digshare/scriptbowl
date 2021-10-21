import {ScriptBowlEventContext} from '../@context';
import {buildTriggerConfig} from '../@utils';

export async function disable(this: ScriptBowlEventContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  let {data} = await this.fc.getFunction(this.serviceName, scriptId);

  let definition = JSON.parse(Object(data).description);

  let {cron} = definition;

  await this.fc.updateFunction(serviceName, scriptId, {
    description: JSON.stringify({...definition, disable: true}),
  });

  if (cron) {
    await this.fc.deleteTrigger(serviceName, scriptId, scriptId);
  }

  return true;
}

export async function enable(this: ScriptBowlEventContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  let {data} = await this.fc.getFunction(this.serviceName, scriptId);

  let definition = JSON.parse(Object(data).description);

  let {cron} = definition;

  await this.fc.updateFunction(serviceName, scriptId, {
    description: JSON.stringify({...definition, disable: false}),
  });

  if (cron) {
    await this.fc.createTrigger(serviceName, scriptId, {
      triggerName: scriptId,
      triggerType: 'timer',
      triggerConfig: buildTriggerConfig(cron),
    });
  }

  return true;
}
