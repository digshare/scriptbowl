import {APIContext, ScriptLogClientDocument} from '../services';

export function getLogs(
  this: APIContext,
  {
    start,
    size,
  }: {
    start: number;
    size: number;
  },
): Promise<ScriptLogClientDocument[]> {
  return this.scriptLogService.list(this.script!, start, size);
}

export function getLogStream(): void {}
