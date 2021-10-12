import {BowlContext} from '../bowl';

export async function getLogs(
  this: BowlContext,
  {
    start,
    size,
  }: {
    start: number;
    size: number;
  },
): Promise<void> {
  // return this.scriptLogService.list(this.script!, start, size);
}

export function getLogStream(): void {}
