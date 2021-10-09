import EventEmitter from 'eventemitter3';

export interface ScriptDocument {
  id: string;
  content: string;
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
    content,
    cron,
    timeout,
    disable,
  }: Partial<Omit<ScriptDocument, 'id' | 'token'>>): Promise<void> {
    return this._update('update', {
      content,
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
        id: this.id,
        type,
        data,
      });
    });
  }
}
