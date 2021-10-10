import {APIContext} from '../services';

export async function run(
  this: APIContext,
  {
    token,
    payload,
  }: {
    token: string;
    payload?: any;
  },
): Promise<void> {
  let script = await this.scriptServices.match(token);

  if (!script || script.disable) {
    throw Error('No running permission');
  }

  await this.scriptServices.run(script, payload);
}
