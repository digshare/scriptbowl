import {getFunctionName} from '../@utils';
import {BowlContext} from '../bowl';

export async function disable(this: BowlContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;
  let httpFunctionName = getFunctionName(scriptId, 'http');

  let {data} = await this.fc.getFunction(this.serviceName, httpFunctionName);

  let {cron} = JSON.parse(Object(data).description);

  await this.fc.deleteTrigger(serviceName, httpFunctionName, httpFunctionName);

  if (cron) {
    let timerFunctionName = getFunctionName(scriptId, 'timer');

    await this.fc.deleteTrigger(
      serviceName,
      timerFunctionName,
      timerFunctionName,
    );
  }

  return true;
}

export async function enable(this: BowlContext): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;
  let httpFunctionName = getFunctionName(scriptId, 'http');

  let {data} = await this.fc.getFunction(this.serviceName, httpFunctionName);

  let {cron} = JSON.parse(Object(data).description);

  await this.fc.createTrigger(serviceName, httpFunctionName, {
    triggerName: httpFunctionName,
    triggerType: 'http',
    triggerConfig: {
      authType: 'function',
      methods: ['GET', 'POST'],
    },
  });

  if (cron) {
    let timerFunctionName = getFunctionName(scriptId, 'timer');

    await this.fc.createTrigger(serviceName, timerFunctionName, {
      triggerName: timerFunctionName,
      triggerType: 'timer',
      triggerConfig: {
        cronExpression: cron,
        enabled: true,
      },
    });
  }

  return true;
}
