import cronParser from 'cron-parser';

export function parseNextTime(cron: string): number {
  return cronParser.parseExpression(cron).next().getTime();
}
