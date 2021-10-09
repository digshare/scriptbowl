import {entrance} from 'entrance-decorator';

import {APIService, DBService, ScriptService, SocketService} from './services';

interface Config {
  server: {
    port: number;
  };
  mongo: {
    uri: string;
    name: string;
  };
}

export class Entrances {
  get ready(): Promise<any> {
    return Promise.all([this.dbService.ready]);
  }

  constructor(private config: Config) {}

  up(): void {
    this.apiService.up();
  }

  /* eslint-disable @mufan/explicit-return-type */

  @entrance
  get dbService() {
    let {mongo} = this.config;

    return new DBService(mongo);
  }

  @entrance
  get socketService() {
    let {server} = this.config;

    return new SocketService(server);
  }

  @entrance
  get apiService() {
    return new APIService(this.socketService, this.scriptService);
  }

  @entrance
  get scriptService() {
    return new ScriptService(this.dbService);
  }

  /* eslint-enable @mufan/explicit-return-type */
}
