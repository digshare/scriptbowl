import {ClientConfig, FCClient} from '@forker/fc2';

import {zipFiles} from './@utils';
import {Core} from './core';
import {Script, ScriptDocument} from './script';

export type ScriptFile =
  | string // file path
  | ScriptFileDeclare;

export interface ScriptFileDeclare {
  text: string;
  mode?: number;
}

export interface ScriptBowlOptions extends ClientConfig {
  accountId: string;
  serviceName: string;
}

export interface BowlContext {
  serviceName: string;
  fc: FCClient;
  script: string | undefined;
}

export class ScriptBowl {
  private ready: Promise<void>;

  readonly fc: FCClient;

  constructor(readonly options: ScriptBowlOptions) {
    let {accountId, serviceName, ...clientOptions} = options;

    let fc = new FCClient(accountId, clientOptions);

    let readyResolve!: () => void;
    this.ready = new Promise<void>(resolve => (readyResolve = resolve));

    fc.getService(serviceName).then(readyResolve, () =>
      // not create
      fc
        .createService(serviceName, {
          description: 'create by scriptbowl',
        })
        .then(readyResolve),
    );

    this.fc = fc;
  }

  async create({
    files,
    ...document
  }: Omit<ScriptDocument, 'id' | 'token'>): Promise<Script> {
    let script = await this.request<string>({
      type: 'create',
      data: {
        ...document,
        content: await zipFiles(files),
      },
    });

    return new Script(script, this.request);
  }

  async get(id: string): Promise<Script | undefined> {
    await this.request<ScriptDocument | undefined>({
      script: id,
      type: 'get',
      data: {
        id,
      },
    });
    return new Script(id, this.request);
  }

  async require(id: string): Promise<Script> {
    let script = await this.get(id);

    if (!script) {
      throw Error('Not found script');
    }

    return script;
  }

  private request = <T>({
    type,
    script,
    data,
  }: {
    script?: string;
    type: string;
    data: any;
  }): Promise<T> => {
    return this.ready.then(() =>
      Core[type as keyof typeof Core].call<BowlContext, any[], any>(
        {
          script,
          fc: this.fc,
          serviceName: this.options.serviceName,
        },
        data as any,
      ),
    );
  };
}
