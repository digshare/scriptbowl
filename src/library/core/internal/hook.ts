import {ScriptContext} from '../../@context';
import {ScriptBowl} from '../../bowl';
import {Script} from '../../script';

export async function hook<
  TData extends
    | {type: 'beforeCreate'; params: Parameters<ScriptBowl['create']>[0]}
    | {type: 'beforeUpdate'; params: Parameters<Script['update']>[0]}
    | {
        type: 'beforeRemove';
        params: Parameters<Script['remove']>[number];
      },
>(this: ScriptContext, data: TData): Promise<TData['params']> {
  for (let listener of this.ee.listeners(data.type)) {
    data.params = (await listener.call(this, data.params)) as any;
  }

  return data.params;
}
