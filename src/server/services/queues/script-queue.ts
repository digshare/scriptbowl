import Queue from 'bull';

import {DockerService} from '../docker';
import {ScriptService} from '../script';
import {ScriptLogService} from '../script-log';

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
    private scriptLogService: ScriptLogService,
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

    let loggers = await this.scriptLogService.getLoggers(script);

    try {
      let result = await this.dockerService.run(
        {
          content: Buffer.concat([header, contentBuffer, payloadBuffer]),
          timeout,
        },
        loggers,
      );

      console.info({exitCode: result.exitCode});
    } catch ({message}) {
      // 超时
      console.info({error: message});
      await loggers[1].record(String(message));
    }

    done();
  };
}
