import {nanoid} from 'nanoid';

import {parseNextTime} from '../@utils';
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
  let nextExecuteAt: number | undefined;

  if (cron) {
    nextExecuteAt = parseNextTime(cron);
  }

  return this.scriptServices.create({
    content,
    cron,
    timeout,
    disable,
    nextExecuteAt,
    token: nanoid(),
  });
}
