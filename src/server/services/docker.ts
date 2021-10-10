import Docker from 'dockerode';

import {StringWritable} from '../@utils';

const IMAGE_NAME_DEFAULT = 'scriptbowl';

export class DockerService {
  readonly docker: Docker;

  constructor(
    readonly dockerOptions: Docker.DockerOptions & {
      image: string;
    } = {
      image: IMAGE_NAME_DEFAULT,
    },
  ) {
    this.docker = new Docker(dockerOptions);
  }

  async run({
    content,
    timeout,
  }: {
    content: string;
    timeout: number;
  }): Promise<string> {
    let {image} = this.dockerOptions;
    let containerRef: Docker.Container | undefined;

    return Promise.race<string>([
      new Promise<any>((_, reject) =>
        setTimeout(async () => {
          if (containerRef) {
            void containerRef.stop();
          }

          reject(Error('TIMEOUT'));
        }, timeout),
      ),
      new Promise<string>(async (resolve, reject) => {
        let stdout = new StringWritable();
        let stderr = new StringWritable();

        let container = await this.docker.createContainer({
          Image: image,
          Tty: false,
          OpenStdin: true,
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          StdinOnce: true,
        });

        containerRef = container;

        let stream = await container.attach({
          stream: true,
          stdin: true,
          stdout: true,
          stderr: true,
        });

        container.modem.demuxStream(stream, stdout, stderr);

        await container.start();

        stream.write(`${content}\n`);

        let {StatusCode} = await container.wait();

        await container.remove();

        containerRef = undefined;

        if (StatusCode) {
          // TODO 尽管抛错了, 但仍然需要记录 log
          reject(Error(await stderr.end()));
        } else {
          resolve(stdout.end());
        }
      }),
    ]);
  }
}
