import {getFunctionName} from '../@utils';
import {BowlContext} from '../bowl';

export async function run(this: BowlContext, payload?: any): Promise<void> {
  let data = await this.fc.invokeFunction(
    this.serviceName,
    getFunctionName(this.script!, 'http'),
    Buffer.from(JSON.stringify({payload}), 'binary'),
  );

  console.log(data);

  // if (!script || script.disable) {
  //   throw Error('No running permission');
  // }
  // await this.scriptQueueService.addJob({
  //   script: script._id.toHexString(),
  //   payload,
  // });
}
