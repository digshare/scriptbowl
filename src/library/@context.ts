import {FCClient} from '@forker/fc2';
import EventEmitter from 'eventemitter3';

import {ScriptBowlEvent, ScriptLogger} from './bowl';

export interface ScriptContext {
  serviceName: string;
  script: string | undefined;
  fc: FCClient;
  ee: EventEmitter<ScriptBowlEvent>;
  logger: ScriptLogger;
}
