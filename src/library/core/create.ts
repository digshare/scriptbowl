import {ScriptBowlEventContext} from '../@context';
import {createScriptId} from '../@utils';
import {ScriptCron, ScriptRuntime} from '../script';

import {enable} from './disable';

export async function create(
  this: ScriptBowlEventContext,
  {
    runtime,
    entrance,
    content,
    cron,
    timeout,
    disable = false,
    env,
  }: {
    runtime: ScriptRuntime;
    entrance: string;
    content: string;
    cron?: ScriptCron;
    timeout?: number;
    disable?: boolean;
    env?: Record<string, string>;
  },
): Promise<string> {
  let serviceName = this.serviceName;
  let scriptId = createScriptId(serviceName);

  await this.fc.createFunction(serviceName, {
    functionName: scriptId,
    handler: entrance,
    description: JSON.stringify({
      cron,
      disable,
    }),
    code: {
      zipFile: content,
    },
    runtime,
    timeout,
    environmentVariables: env,
  });

  if (!disable) {
    await enable.call({...this, script: scriptId});
  }

  return scriptId;
}
