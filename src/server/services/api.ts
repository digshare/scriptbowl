import {API} from '../api';

import {ScriptService} from './script';
import {SocketService} from './socket';

export interface APIContext {
  id: string;
  scriptServices: ScriptService;
}

export class APIService {
  constructor(
    private socketService: SocketService,
    private scriptService: ScriptService,
  ) {}

  up(): void {
    this.socketService.wss.on('connection', ws => {
      ws.on('message', async message => {
        try {
          let {id, type, data} = JSON.parse(String(message));

          try {
            let response = await API[type as keyof typeof API].call<
              APIContext,
              any[],
              any
            >(
              {
                id,
                scriptServices: this.scriptService,
              },
              data as any,
            );
            ws.send(JSON.stringify({id, data: response}));
          } catch ({message: error}) {
            ws.send(JSON.stringify({id, error}));
          }
        } catch (error) {
          // invalid request
        }
      });
    });
  }
}
