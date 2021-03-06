import {ScriptBowlEventContext} from '../@context';
import {payloadToString} from '../@utils';

export async function run(
  this: ScriptBowlEventContext,
  {
    payload,
    returnLogs,
  }: {
    payload?: any;
    returnLogs?: boolean;
  },
): Promise<any> {
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
      /**
       * 这儿的套娃原因：
       * 定时器触发会把 payload 包裹在一个对象的 payload 字段里
       * 为了使用统一，我们这也包一层
       */
      Buffer.from(payloadToString({payload: payloadToString(payload)}), 'utf8'),
      {
        ...(returnLogs
          ? {
              'X-Fc-Log-Type': 'Tail',
            }
          : {}),
      },
    )
    .then(res =>
      Promise.all(
        this.ee
          .listeners('afterExecuted')
          .map(listener => listener.call(this, res.data)),
      ).then(() => {
        if (!returnLogs) {
          return res.data;
        }

        return {
          data: res.data,
          logs: Buffer.from(
            (res.headers['x-fc-log-result'] as string) ?? '',
            'base64',
          ).toString('utf8'),
        };
      }),
    );
}
