import {uniqueId} from '../@utils';
import {BowlContext} from '../bowl';
import {ScriptRuntime} from '../script';

import {enable} from './disable';

export async function create(
  this: BowlContext,
  {
    runtime,
    entrance,
    content,
    cron,
    timeout,
    disable = false,
  }: {
    runtime: ScriptRuntime;
    entrance: string;
    content: string;
    cron?: string;
    timeout?: number;
    disable?: boolean;
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
