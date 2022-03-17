import {ScriptBowlEventContext} from '../@context';
import {buildTriggerConfig, isSameScriptCron} from '../@utils';
import {ScriptCron, ScriptRuntime} from '../script';

import {disable, enable} from './disable';

export async function update(
  this: ScriptBowlEventContext,
  {
    runtime,
    entrance,
    content,
    cron,
    timeout,
    disable: disableValue,
    env,
  }: {
    runtime?: ScriptRuntime;
    entrance?: string;
    content?: string;
    cron?: ScriptCron;
    timeout?: number;
    disable?: boolean;
    env?: Record<string, string>;
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
      ...(cron !== undefined
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
    ...(env !== undefined
      ? {
          environmentVariables: env,
        }
      : {}),
  });

  let disableChanged =
    disableValue !== undefined && disableValue !== definition.disable;

  if (
    !isSameScriptCron(cron, definition.cron) &&
    // 禁用的设置没有变
    !disableChanged &&
    // 且没被禁用
    !definition.disable
  ) {
    // 空字符串也表示停用 timer 触发器
    if (cron) {
      try {
        // 尝试更新,更新失败就创建
        await this.fc.updateTrigger(serviceName, scriptId, scriptId, {
          triggerConfig: buildTriggerConfig(cron),
        });
      } catch (error) {
        await this.fc.createTrigger(serviceName, scriptId, {
          triggerName: scriptId,
          triggerType: 'timer',
          triggerConfig: buildTriggerConfig(cron),
        });
      }
    } else {
      try {
        await this.fc.deleteTrigger(serviceName, scriptId, scriptId);
      } catch (error) {}
    }
  }

  if (disableChanged) {
    if (disableValue) {
      await disable.call(this);
    } else {
      await enable.call(this);
    }
  }

  return true;
}
