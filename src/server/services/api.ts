import {API} from '../api';

import {ScriptQueueService} from './queues';
import {ScriptService} from './script';
import {SocketService} from './socket';

export interface APIContext {
  scriptServices: ScriptService;
  scriptQueueService: ScriptQueueService;
  script: string | undefined;
}

export class APIService {
  constructor(
    private socketService: SocketService,
    private scriptService: ScriptService,
    private scriptQueueService: ScriptQueueService,
  ) {}

  up(): void {
    this.socketService.wss.on('connection', ws => {
      ws.on('message', async message => {
        try {
          let {id, type, script, data} = JSON.parse(String(message));

          try {
            let response = await API[type as keyof typeof API].call<
              APIContext,
              any[],
              any
            >(
              {
                script,
                scriptServices: this.scriptService,
                scriptQueueService: this.scriptQueueService,
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
