import {APIContext} from '../services';

export async function remove(this: APIContext): Promise<boolean> {
  return this.scriptServices.delete(this.script!);
}
