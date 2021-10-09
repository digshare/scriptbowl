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

  console.info('run script', script, payload);
}
