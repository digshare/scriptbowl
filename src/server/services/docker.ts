import * as Path from 'path';

import Docker from 'dockerode';

import {StringWritable} from '../@utils';

const TAG = 'sb-test';

export class DockerService {
  readonly docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  up(): void {
    let docker = this.docker;

    // 构建镜像的 测试
    async function _test(): Promise<void> {
      console.info('image building...');
      let stream = await docker.buildImage(
        {
          context: Path.join(__dirname, '../../../src/server/@digshare'),
          src: ['Dockerfile', 'main.js'],
        },
        {
          t: TAG,
        },
      );
      await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => {
          return err ? reject(err) : resolve(res);
        });
      });

      // TODO 打印构建时的 log
      // await new Promise((resolve, reject) => {
      //   docker.modem.followProgress(
      //     stream,
      //     (err, res) => {
      //       return err ? reject(err) : resolve(res);
      //     },
      //     obj => {
      //       let {status, stream, progress} = obj;
      //       process.stdout.write(
      //         `${status || stream}${progress ? `${progress}` : ''}\r`,
      //       );
      //     },
      //   );
      // });
      console.info('image builded');
    }

    // _test();
  }

  async run(): Promise<string> {
    let stdout = new StringWritable();
    let stderr = new StringWritable();

    let [{StatusCode}, container] = await this.docker.run(
      TAG,
      [],
      [stdout, stderr],
      {
        Tty: false,
      },
    );

    await container.remove();

    // TODO log 记录

    if (StatusCode) {
      // TODO 尽管抛错了, 但仍然需要记录 log
      throw new Error(await stderr.end());
    }

    return stdout.end();
  }
}
