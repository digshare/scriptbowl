import {APIContext} from '../services';

export async function disable(this: APIContext): Promise<boolean> {
  return this.scriptServices.update(this.id, {
    disable: true,
  });
}

export async function enable(this: APIContext): Promise<boolean> {
  return this.scriptServices.update(this.id, {
    disable: false,
  });
}
