import {Binary} from 'mongodb';

import {parseNextTime} from '../@utils';
import {APIContext} from '../services';

export async function update(
  this: APIContext,
  {
    entrance,
    content,
    cron,
    timeout,
    disable,
  }: {
    entrance?: string;
    content?: string;
    cron?: string;
    timeout?: number;
    disable?: boolean;
  },
): Promise<boolean> {
  return this.scriptServices.update(this.script!, {
    ...(entrance !== undefined ? {entrance} : {}),
    ...(content !== undefined
      ? {
          content: new Binary(Buffer.from(content, 'binary')),
        }
      : {}),
    ...(cron !== undefined
      ? {cron, nextExecuteAt: parseNextTime(cron)}
      : {
          nextExecuteAt: undefined,
        }),
    ...(timeout !== undefined ? {timeout} : {}),
    ...(disable !== undefined ? {disable} : {}),
  });
}
