import {BowlContext} from '../bowl';

export async function disable(this: BowlContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  let {data} = await this.fc.getFunction(this.serviceName, scriptId);

  let {cron} = JSON.parse(Object(data).description);

  await this.fc.updateFunction(serviceName, scriptId, {
    description: JSON.stringify({cron, disable: true}),
  });

  if (cron) {
    await this.fc.deleteTrigger(serviceName, scriptId, scriptId);
  }

  return true;
}

export async function enable(this: BowlContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  let {data} = await this.fc.getFunction(this.serviceName, scriptId);

  let {cron} = JSON.parse(Object(data).description);

  await this.fc.updateFunction(serviceName, scriptId, {
    description: JSON.stringify({cron, disable: false}),
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
