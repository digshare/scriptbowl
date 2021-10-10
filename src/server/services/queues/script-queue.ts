import Queue from 'bull';

import {DockerService} from '../docker';
import {ScriptService} from '../script';

export interface ScriptJobData {
  script: string;
  payload?: any;
}

export interface ScriptQueueOptions {
  concurrency: number;
  timeout: number;
}

export class ScriptQueueService {
  private queue!: Queue.Queue;

  constructor(
    private dockerService: DockerService,
    private scriptService: ScriptService,
    readonly uri: string,
    readonly options: ScriptQueueOptions,
  ) {}

  up(): void {
    let {concurrency, timeout} = this.options;

    let queue = new Queue<ScriptJobData>('scripts', this.uri, {
      defaultJobOptions: {
        timeout,
      },
    });

    queue.process(concurrency, this.process).catch(console.error);

    this.queue = queue;
  }

  addJob(data: ScriptJobData): Promise<Queue.Job> {
    return this.queue.add(data);
  }

  private process = async (
    job: Queue.Job<ScriptJobData>,
    done: Queue.DoneCallback,
  ): Promise<void> => {
    let {script, payload} = job.data;

    let document = await this.scriptService.query(script);

    if (!document || document.disable) {
      return;
    }

    let {timeout, content} = document;

    timeout = Number(timeout) || this.options.timeout;

    let contentBuffer = content.buffer;
    let payloadBuffer = Buffer.from(JSON.stringify({payload}));

    let header = Buffer.allocUnsafe(8);

    header.writeUInt32BE(contentBuffer.length, 0);
    header.writeUInt32BE(payloadBuffer.length, 4);

    try {
      let result = await this.dockerService.run({
        content: Buffer.concat([header, contentBuffer, payloadBuffer]),
        timeout,
      });

      console.info({result});
    } catch ({message}) {
      // TODO 记录执行超时 和 报错
      console.info({error: message});
    }

    done();
  };
}
