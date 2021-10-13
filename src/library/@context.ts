import {FCClient} from '@forker/fc2';

import {ScriptLogger} from './bowl';

export interface ScriptContext {
  serviceName: string;
  fc: FCClient;
  script: string | undefined;
  logger: ScriptLogger;
}
