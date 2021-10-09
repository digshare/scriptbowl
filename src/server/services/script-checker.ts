import {CronJob} from 'cron';
import {Filter} from 'mongodb';

import {parseNextTime} from '../@utils';

import {CronService} from './cron';
import {ScriptDocument, ScriptService} from './script';

const SCRIPT_CRON_DEFAULT = '*/1 * * * *';

export class ScriptCheckerService {
  private cronJob: CronJob | undefined;

  constructor(
    private scriptService: ScriptService,
    private cronService: CronService,
  ) {}

  up(): void {
    this.cronJob = this.cronService.addCronJob(
      SCRIPT_CRON_DEFAULT,
      this.onScriptTick,
    );
  }

  stopCronJob(): void {
    this.cronJob?.stop();
  }

  private onScriptTick = async (): Promise<void> => {
    let collection = this.scriptService.collection;

    let filter: Filter<ScriptDocument> = {
      nextExecuteAt: {
        $lt: Date.now(),
      },
    };

    let scripts = await collection.find(filter).toArray();

    await collection.updateMany(filter, {
      $set: {
        nextExecuteAt: undefined,
      },
    });

    let promiseList: Promise<any>[] = [];

    for (let script of scripts) {
      promiseList.push(this.scriptService.run(script));

      if (script.cron) {
        promiseList.push(
          collection.updateOne(
            {
              _id: script._id,
            },
            {
              $set: {
                nextExecuteAt: parseNextTime(script.cron),
              },
            },
          ),
        );
      }
    }

    await Promise.all(promiseList);
  };
}
