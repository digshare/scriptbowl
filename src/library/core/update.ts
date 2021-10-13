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
    meta,
  }: {
    runtime?: ScriptRuntime;
    entrance?: string;
    content?: string;
    cron?: string;
    timeout?: number;
    disable?: boolean;
    meta?: any;
  },
): Promise<boolean> {
  let serviceName = this.serviceName;
  let scriptId = this.script!;

  let {data} = await this.fc.getFunction(this.serviceName, scriptId);

  let definition = JSON.parse(Object(data).description);

  await this.fc.updateFunction(serviceName, scriptId, {
    ...(runtime !== undefined
      ? {
          runtime,
        }
      : {}),
    ...(entrance !== undefined
      ? {
          handler: entrance,
        }
      : {}),
    ...(timeout !== undefined
      ? {
          timeout,
        }
      : {}),
    ...(content !== undefined
      ? {
          code: {
            zipFile: content,
          },
        }
      : {}),
    description: JSON.stringify({
      ...definition,
      ...(meta
        ? {
            meta,
          }
        : {}),
      ...(cron
        ? {
            cron,
          }
        : {}),
      ...(disableValue !== undefined
        ? {
            disable: disableValue,
          }
        : {}),
    }),
  });

  if (cron) {
    await this.fc.updateTrigger(serviceName, scriptId, scriptId, {
      triggerConfig: {
        cronExpression: cron,
        enabled: true,
      },
    });
  }

  if (disableValue !== undefined && disableValue !== definition.disable) {
    if (disableValue) {
      await disable.call(this);
    } else {
      await enable.call(this);
    }
  }

  return true;
}
