import {ScriptBowlEventContext} from '../@context';
import {uniqueId} from '../@utils';
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
    meta,
  }: {
    runtime: ScriptRuntime;
    entrance: string;
    content: string;
    cron?: ScriptCron;
    timeout?: number;
    disable?: boolean;
    meta?: any;
  },
): Promise<string> {
  let serviceName = this.serviceName;
  let scriptId = uniqueId();

  await this.fc.createFunction(serviceName, {
    functionName: scriptId,
    handler: entrance,
    description: JSON.stringify({
      cron,
      disable,
      meta,
    }),
    code: {
      zipFile: content,
    },
    runtime,
    timeout,
  });

  if (!disable) {
    await enable.call({...this, script: scriptId});
  }

  return scriptId;
}
