import {ScriptContext} from '../@context';

export async function run(this: ScriptContext, payload?: any): Promise<any> {
  let serviceName = this.serviceName;
  let script = this.script!;

  let {data} = await this.fc.getFunction(serviceName, script);

  let {disable} = JSON.parse(Object(data).description);

  if (disable) {
    console.error('Run disabled script failed!');
    return;
  }

  return this.fc
    .invokeFunction(
      serviceName,
      script,
      Buffer.from(JSON.stringify({payload}), 'binary'),
    )
    .then(res => res.data);
}
