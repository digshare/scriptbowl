import {WebSocket} from 'ws';

import {uniqueId, zipFiles} from './@utils';
import {Script, ScriptDocument} from './script';

export type ScriptFile =
  | string // file path
  | ScriptFileDeclare;

export interface ScriptFileDeclare {
  text: string;
  mode?: number;
}

export class ScriptBowl {
  private resolverMap = new Map<
    string,
    {
      resolve: (res: any) => void;
      reject: (error: any) => void;
    }
  >();
  private ready: Promise<void>;
  private ws: WebSocket;

  constructor(readonly hostname: string) {
    let readyResolve!: () => void;
    let ready = new Promise<void>(resolve => (readyResolve = resolve));

    this.ready = ready;

    let ws = new WebSocket(hostname);

    ws.on('open', readyResolve);
    ws.on('message', message => {
      try {
        let {id, data, error} = JSON.parse(String(message));
        let {resolve, reject} = this.resolverMap.get(id)!;

        if (error) {
          return reject(new Error(error));
        }

        resolve(data);
      } catch (error) {
        // invalid response
      }
    });

    this.ws = ws;
  }

  async create({
    files,
    ...document
  }: Omit<ScriptDocument, 'id' | 'token'>): Promise<Script> {
    let script = await this.request<ScriptDocument>({
      type: 'create',
      data: {
        ...document,
        content: await zipFiles(files, document.entrance),
      },
    });

    return new Script(script, this.request);
  }

  async get(id: string): Promise<Script | undefined> {
    let script = await this.request<ScriptDocument | undefined>({
      script: id,
      type: 'get',
      data: {
        id,
      },
    });
    return script && new Script(script, this.request);
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
    return this.ready.then(
      () =>
        new Promise((resolve, reject) => {
          let id = uniqueId();
          this.resolverMap.set(id, {resolve, reject});
          this.ws.send(
            JSON.stringify({
              id,
              type,
              script,
              data,
            }),
          );
        }),
    );
  };
}
