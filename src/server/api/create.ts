import {Binary} from 'mongodb';
import {nanoid} from 'nanoid';

import {parseNextTime} from '../@utils';
import {APIContext, ScriptClientDocument} from '../services';

export async function create(
  this: APIContext,
  {
    entrance,
    content,
    cron,
    timeout,
    disable = false,
  }: {
    entrance: string;
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
    entrance,
    content: new Binary(Buffer.from(content, 'binary')),
    cron,
    timeout,
    disable,
    nextExecuteAt,
    token: nanoid(),
  });
}
