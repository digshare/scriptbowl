import {entrance} from 'entrance-decorator';

import {
  APIService,
  CronService,
  DBService,
  ScriptCheckerService,
  ScriptQueueService,
  ScriptService,
  SocketService,
} from './services';

interface Config {
  server: {
    port: number;
  };
  queue: {
    script: {
      concurrency: number;
      timeout: number;
    };
  };
  redis: {
    uri: string;
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
    this.scriptCheckerService.up();
    this.scriptQueueService.up();
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
  get cronService() {
    return new CronService();
  }

  @entrance
  get apiService() {
    return new APIService(this.socketService, this.scriptService);
  }

  @entrance
  get scriptQueueService() {
    let {
      redis: {uri},
      queue: {script},
    } = this.config;

    return new ScriptQueueService(uri, script);
  }

  @entrance
  get scriptService() {
    return new ScriptService(this.dbService, this.scriptQueueService);
  }

  @entrance
  get scriptCheckerService() {
    return new ScriptCheckerService(this.scriptService, this.cronService);
  }

  /* eslint-enable @mufan/explicit-return-type */
}
