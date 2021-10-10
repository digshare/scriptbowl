import Queue from 'bull';

import {DockerService} from '../docker';
import {ScriptDocument} from '../script';

export interface ScriptJobData {
  script: ScriptDocument;
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
    return this.queue.add(data, {
      // 暂时不限制 一个脚本只能同时有一个在跑
      // jobId: data.script._id.toHexString(),
    });
  }

  private process = async (
    job: Queue.Job<ScriptJobData>,
    done: Queue.DoneCallback,
  ): Promise<void> => {
    let {
      script: {content, timeout},
      payload,
    } = job.data;

    timeout = Number(timeout) || this.options.timeout;

    try {
      let result = await this.dockerService.run({
        content: JSON.stringify({content, payload}),
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