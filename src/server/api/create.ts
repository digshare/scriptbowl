import {nanoid} from 'nanoid';

import {APIContext, ScriptClientDocument} from '../services';

export async function create(
  this: APIContext,
  {
    content,
    cron,
    timeout,
    disable = false,
  }: {
    content: string;
    cron?: string;
    timeout?: number;
    disable?: boolean;
  },
): Promise<ScriptClientDocument> {
  return this.scriptServices.create({
    content,
    cron,
    timeout,
    disable,
    lastExecutedAt: undefined,
    token: nanoid(),
  });
}
