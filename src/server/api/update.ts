import {parseNextTime} from '../@utils';
import {APIContext} from '../services';

export async function update(
  this: APIContext,
  {
    content,
    cron,
    timeout,
    disable,
  }: {
    content?: string;
    cron?: string;
    timeout?: number;
    disable?: boolean;
  },
): Promise<boolean> {
  return this.scriptServices.update(this.id, {
    ...(content !== undefined ? {content} : {}),
    ...(cron !== undefined
      ? {cron, nextExecuteAt: parseNextTime(cron)}
      : {
          nextExecuteAt: undefined,
        }),
    ...(timeout !== undefined ? {timeout} : {}),
    ...(disable !== undefined ? {disable} : {}),
  });
}
