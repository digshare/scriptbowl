import Queue from 'bull';

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

  constructor(readonly uri: string, readonly options: ScriptQueueOptions) {}

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
    let {script, payload} = job.data;

    let timeout = Number(script.timeout) || this.options.timeout;

    let staled = await Promise.race([
      new Promise<true>(resolve => setTimeout(() => resolve(true), timeout)),
      new Promise<false>(resolve => {
        setTimeout(() => {
          console.log('执行代码', script.content, payload);

          resolve(false);
        }, 600);
      }),
    ]);

    if (!staled) {
      done();
      return;
    }

    // TODO
    console.log('超时');
  };
}
