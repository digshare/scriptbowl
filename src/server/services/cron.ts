import {CronJob, job as cronJob} from 'cron';

export class CronService {
  addCronJob(cronTime: string, onTick: () => void): CronJob {
    return cronJob({
      cronTime,
      onTick,
      start: true,
    });
  }
}
