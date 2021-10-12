import {BowlContext} from '../bowl';

export async function run(this: BowlContext, payload?: any): Promise<void> {
  let serviceName = this.serviceName;
  let script = this.script!;

  let {data} = await this.fc.getFunction(serviceName, script);

  let {disable} = JSON.parse(Object(data).description);

  if (disable) {
    console.error('Run disabled script failed!');
    return;
  }

  await this.fc.invokeFunction(
    serviceName,
    script,
    Buffer.from(JSON.stringify({payload}), 'binary'),
  );
}
