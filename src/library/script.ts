import EventEmitter from 'eventemitter3';
import JSZip from 'jszip';

export type ScriptFile =
  | string // file path
  | ScriptFileDeclare;

export interface ScriptFileDeclare {
  text: string;
  /**
   * @deprecated zip 后会丢失 mode
   */
  mode?: number;
}

export interface FilesScriptCode {
  type: 'files';
  files: {
    [fileName: string]: ScriptFile;
  };
}

export interface DirectoryScriptCode {
  type: 'directory';
  directory: string;
}

export interface ZipScriptCode {
  type: 'local-zip' | 'remote-zip';
  zipPath: string;
}

export interface ZippedScriptCode {
  type: 'js-zip';
  zip: JSZip;
}

export interface GithubScriptCode {
  type: 'github';
  owner: string;
  project: string;
  /**
   * default: main
   */
  branch?: string;
}

export type ScriptCode =
  | FilesScriptCode
  | DirectoryScriptCode
  | ZipScriptCode
  | ZippedScriptCode
  | GithubScriptCode;

export type ScriptRuntime =
  | 'nodejs10'
  | 'nodejs12'
  | 'nodejs14'
  | 'python2.7'
  | 'python3'
  | 'java8'
  | 'java11'
  | 'php7.2';

export type ScriptCron =
  | string
  | {
      expression: string;
      payload: any;
    };

export interface ScriptDefinition<
  TEnv extends Record<string, string> = Record<string, string>,
> {
  runtime: ScriptRuntime;
  /**
   * 入口函数, index.main
   */
  entrance: string;
  /**
   * 文件列表
   */
  code: ScriptCode;
  /**
   * 定时执行 cron 表达式
   * https://help.aliyun.com/document_detail/171746.html#p-ouc-hsc-kjo
   */
  cron?: ScriptCron;
  /**
   * 执行超时时间（秒）
   */
  timeout?: number;
  disable?: boolean;
  /**
   * 添加到函数的环境变量
   */
  env?: TEnv;
}

export interface ScriptLog {
  message: string;
  time: number;
}

export class Script {
  private ee = new EventEmitter();

  private updating:
    | {
        resolve: (res: any) => void;
        reject: (error: any) => void;
      }
    | undefined;

  constructor(readonly id: string, updater?: (event: any) => Promise<any>) {
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

  async update(params: Partial<ScriptDefinition>): Promise<void> {
    params = await this._update('hook', {
      type: 'beforeUpdate',
      params,
    });

    let {code, ...definition} = params;

    return this._update('update', {
      ...definition,
      content: code && (await this._update('zipCode', code)),
    });
  }

  async run<TReturn>(payload?: any): Promise<TReturn> {
    return this._update('run', {payload});
  }

  async invoke<TReturn>(payload?: any): Promise<{
    data: TReturn;
    logs: string;
  }> {
    return this._update('run', {
      payload,
      returnLogs: true,
    });
  }

  async enable(): Promise<boolean> {
    return !!(await this._update('enable'));
  }

  async disable(): Promise<boolean> {
    return !!(await this._update('disable'));
  }

  async remove(): Promise<boolean> {
    await this._update('hook', {
      type: 'beforeRemove',
      params: undefined,
    });

    let result = !!(await this._update('remove'));

    await this._update('hook', {
      type: 'afterRemove',
      params: undefined,
    });

    return result;
  }

  async getLogs(
    from: number,
    {
      to = Date.now(),
      reverse = false,
      offset = 0,
    }: {
      to?: number;
      reverse?: boolean;
      offset?: number;
    } = {},
  ): Promise<ScriptLog[]> {
    return this._update('getLogs', {from, to, reverse, offset});
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
