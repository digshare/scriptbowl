import {BowlContext} from '../bowl';

export async function remove(this: BowlContext): Promise<boolean> {
  await this.fc.deleteFunction(this.serviceName, this.script!);
  return true;
}
