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
    ...(cron !== undefined ? {cron} : {}),
    ...(timeout !== undefined ? {timeout} : {}),
    ...(disable !== undefined ? {disable} : {}),
  });
}
