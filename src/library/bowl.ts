import {WebSocket} from 'ws';

import {uniqueId} from './@utils';
import {Script, ScriptDocument} from './script';

export interface ScriptCreateOptions {
  content: string;
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
          return reject(error);
        }

        resolve(data);
      } catch (error) {
        // invalid response
      }
    });

    this.ws = ws;
  }

  async create(document: ScriptDocument): Promise<Script> {
    let id = uniqueId();
    await this.request('create', document);
    return new Script(id);
  }

  async get(id: string): Promise<Script | undefined> {
    await this.request('get', {id});
    return new Script(id);
  }

  private async request(type: string, data: any): Promise<void> {
    return this.ready.then(
      () =>
        new Promise((resolve, reject) => {
          let id = uniqueId();
          this.resolverMap.set(id, {resolve, reject});
          this.ws.send(
            JSON.stringify({
              id,
              type,
              data,
            }),
          );
        }),
    );
  }
}
