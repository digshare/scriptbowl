import {WebSocketServer} from 'ws';

import {API} from './api';

const wss = new WebSocketServer({
  port: 8080,
});

wss.on('connection', ws => {
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

console.info(`Serve start at port ${wss.options.port}`);
