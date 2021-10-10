import EventEmitter from 'eventemitter3';

import {zipFiles} from './@utils';
import {ScriptFile} from './bowl';

export interface ScriptDocument {
  id: string;
  /**
   * 入口文件名称
   */
  entrance: string;
  /**
   * 文件列表
   */
  files: {
    [fileName in string]: ScriptFile;
  };
  token: string;
  /**
   * 定时执行 cron 表达式
   */
  cron?: string;
  /**
   * 执行超时时间
   */
  timeout?: number;
  disable?: boolean;
}

export class Script {
  private ee = new EventEmitter();

  private updating:
    | {
        resolve: (res: any) => void;
        reject: (error: any) => void;
      }
    | undefined;

  get id(): string {
    return this.document.id;
  }

  constructor(
    private readonly document: ScriptDocument,
    updater?: (event: any) => Promise<any>,
  ) {
    if (updater) {
      this.ee.on('update', event => {
        let updating = this.updating;

        if (!updating) {
          return;
        }

        updater(event)
          .then(updating.resolve, updating.reject)
          .finally(() => (this.updating = undefined));
      });
    }
  }

  async update({
    entrance,
    files,
    cron,
    timeout,
    disable,
  }: Partial<Omit<ScriptDocument, 'id' | 'token'>>): Promise<void> {
    return this._update('update', {
      entrance,
      content:
        files && (await zipFiles(files, entrance || this.document.entrance)),
      cron,
      timeout,
      disable,
    });
  }

  async run(payload?: any): Promise<void> {
    return this._update('run', {
      token: this.document.token,
      payload,
    });
  }

  async enable(): Promise<boolean> {
    return !!(await this._update('enable'));
  }

  async disable(): Promise<boolean> {
    return !!(await this._update('disable'));
  }

  async remove(): Promise<boolean> {
    return !!(await this._update('remove'));
  }

  async getLog(): Promise<string> {
    return '';
  }

  async getLogStream(): Promise<Buffer> {
    return Buffer.from('');
  }

  private async _update<T>(type: string, data?: any): Promise<T> {
    if (this.updating) {
      throw Error(
        `Cant not ${type} script during updating, forget use 'await' ?`,
      );
    }

    return new Promise((resolve, reject) => {
      this.updating = {resolve, reject};
      this.ee.emit('update', {
        script: this.id,
        type,
        data,
      });
    });
  }
}
