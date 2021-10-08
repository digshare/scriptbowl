import {API} from '../api';

import {SocketService} from './socket';

export class APIService {
  constructor(private socketService: SocketService) {}

  up(): void {
    this.socketService.wss.on('connection', ws => {
      ws.on('message', async message => {
        try {
          let {id, type, data} = JSON.parse(String(message));
          let response = await API[type as keyof typeof API](data as any);
          ws.send(JSON.stringify({id, data: response}));
        } catch (error) {
          // invalid request
        }
      });
    });
  }
}
