import {entrance} from 'entrance-decorator';

import {
  APIService,
  CronService,
  DBService,
  DockerService,
  ScriptCheckerService,
  ScriptQueueService,
  ScriptService,
  SocketService,
} from './services';

interface Config {
  server: {
    port: number;
  };
  docker: {
    image: string;
    socketPath?: string;
    host?: string;
    port?: number | string;
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
  get dockerService() {
    let {docker} = this.config;

    return new DockerService(docker);
  }

  @entrance
  get cronService() {
    return new CronService();
  }

  @entrance
  get apiService() {
    return new APIService(
      this.socketService,
      this.scriptService,
      this.scriptQueueService,
    );
  }

  @entrance
  get scriptQueueService() {
    let {
      redis: {uri},
      queue: {script},
    } = this.config;

    return new ScriptQueueService(
      this.dockerService,
      this.scriptService,
      uri,
      script,
    );
  }

  @entrance
  get scriptService() {
    return new ScriptService(this.dbService);
  }

  @entrance
  get scriptCheckerService() {
    return new ScriptCheckerService(
      this.scriptService,
      this.scriptQueueService,
      this.cronService,
    );
  }

  /* eslint-enable @mufan/explicit-return-type */
}
