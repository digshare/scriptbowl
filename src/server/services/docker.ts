import {Writable} from 'stream';

import Docker from 'dockerode';

import {StringWritable} from '../@utils';

const IMAGE_NAME_DEFAULT = 'scriptbowl';

export interface DockerContainerRunResult {
  exitCode: number;
  stdList: [Writable, Writable];
}

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

  async run(
    {
      content,
      timeout,
    }: {
      content: Buffer;
      timeout: number;
    },
    stdList?: [Writable, Writable],
  ): Promise<DockerContainerRunResult> {
    let {image} = this.dockerOptions;
    let containerRef: Docker.Container | undefined;

    return Promise.race<DockerContainerRunResult>([
      new Promise<any>((_, reject) =>
        setTimeout(async () => {
          if (containerRef) {
            void containerRef.stop();
          }

          reject(Error('TIMEOUT'));
        }, timeout),
      ),
      new Promise<DockerContainerRunResult>(async resolve => {
        let stdout = stdList?.[0] || new StringWritable();
        let stderr = stdList?.[1] || new StringWritable();

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

        stream.write(content);

        let {StatusCode} = await container.wait();

        await container.remove();

        containerRef = undefined;

        stdout.end();
        stderr.end();

        resolve({
          exitCode: StatusCode,
          stdList: [stdout, stderr],
        });
      }),
    ]);
  }
}
