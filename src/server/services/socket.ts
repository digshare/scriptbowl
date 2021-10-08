import {WebSocketServer} from 'ws';

export interface SocketServerOptions {
  port: number;
}

export class SocketService {
  readonly wss: WebSocketServer;

  constructor({port}: SocketServerOptions) {
    const wss = new WebSocketServer({
      port,
    });

    this.wss = wss;

    console.info(`socket service start at port ${wss.options.port}`);
  }
}
