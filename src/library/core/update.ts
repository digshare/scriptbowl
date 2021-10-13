import {ScriptContext} from '../@context';
import {ScriptRuntime} from '../script';

import {disable, enable} from './disable';

export async function update(
  this: ScriptContext,
  {
    runtime,
    entrance,
    content,
    cron,
    timeout,
    disable: disableValue,
  }: {
    runtime?: ScriptRuntime;
    entrance?: string;
    content?: string;
    cron?: string;
    timeout?: number;
    disable?: boolean;
  },
): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  let {data} = await this.fc.getFunction(this.serviceName, scriptId);

  let meta = JSON.parse(Object(data).description);

  await this.fc.updateFunction(serviceName, scriptId, {
    ...(runtime !== undefined ? {runtime} : {}),
    ...(entrance !== undefined ? {handler: entrance} : {}),
    ...(timeout !== undefined ? {timeout} : {}),
    ...(content !== undefined
      ? {
          code: {
            zipFile: content,
          },
        }
      : {}),
    description: {
      ...meta,
      ...(cron ? {cron} : {}),
      ...(disableValue !== undefined ? {disable: disableValue} : {}),
    },
  });

  if (cron) {
    await this.fc.updateTrigger(serviceName, scriptId, scriptId, {
      triggerConfig: {
        cronExpression: cron,
        enabled: true,
      },
    });
  }

  if (disableValue !== undefined && disableValue !== meta.disable) {
    if (disableValue) {
      await disable.call(this);
    } else {
      await enable.call(this);
    }
  }

  return true;
}
