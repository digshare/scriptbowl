import {getFunctionName} from '../@utils';
import {BowlContext} from '../bowl';

export async function get(this: BowlContext): Promise<any | undefined> {
  return this.fc.getFunction(
    this.serviceName,
    getFunctionName(this.script!, 'http'),
  );
}
