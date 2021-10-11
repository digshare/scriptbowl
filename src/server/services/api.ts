import {API} from '../api';

import {ScriptQueueService} from './queues';
import {ScriptService} from './script';
import {ScriptLogService} from './script-log';
import {SocketService} from './socket';

export interface APIContext {
  scriptServices: ScriptService;
  scriptLogService: ScriptLogService;
  scriptQueueService: ScriptQueueService;
  script: string | undefined;
}

export class APIService {
  constructor(
    private socketService: SocketService,
    private scriptService: ScriptService,
    private scriptLogService: ScriptLogService,
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
                scriptLogService: this.scriptLogService,
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
