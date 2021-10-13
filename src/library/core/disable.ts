import {ScriptContext} from '../@context';

export async function disable(this: ScriptContext): Promise<boolean> {
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

export async function enable(this: ScriptContext): Promise<boolean> {
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
      triggerConfig: {
        cronExpression: cron,
        enabled: true,
      },
    });
  }

  return true;
}
