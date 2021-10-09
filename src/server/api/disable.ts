import {parseNextTime} from '../@utils';
import {APIContext} from '../services';

export async function disable(this: APIContext): Promise<boolean> {
  return this.scriptServices.update(this.id, {
    disable: true,
    nextExecuteAt: undefined,
  });
}

export async function enable(this: APIContext): Promise<boolean> {
  let scriptId = this.id;

  let script = await this.scriptServices.get(scriptId);

  if (!script?.disable) {
    return false;
  }

  return this.scriptServices.update(scriptId, {
    disable: false,
    nextExecuteAt: script.cron ? parseNextTime(script.cron) : undefined,
  });
}
