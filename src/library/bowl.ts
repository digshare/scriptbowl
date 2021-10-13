import {ClientConfig, FCClient} from '@forker/fc2';
import ALY from 'aliyun-sdk';

import {ScriptContext} from './@context';
import {generateScriptCodeString} from './@utils';
import {Core} from './core';
import {Script, ScriptDefinition, ScriptLog} from './script';

export interface ScriptBowlOptions extends ClientConfig {
  accountId: string;
  serviceName: string;
  logger?:
    | {
        accessKeyID?: string;
        accessKeySecret?: string;
        /**
         * 日志服务与云函数 region 不一致时需设置
         */
        region?: string;
      }
    | false;
}

export interface ScriptLogger {
  getLogs(script: string, from: number, to: number): Promise<ScriptLog[]>;
}

export class ScriptBowl {
  private ready: Promise<void>;

  private logConfig:
    | {
        project: string;
        logstore: string;
      }
    | undefined;

  private readonly fc: FCClient;

  private sls: {getLogs: any} | undefined;

  constructor(private readonly options: ScriptBowlOptions) {
    let {accountId, serviceName, ...clientOptions} = options;

    let fc = new FCClient(accountId, clientOptions);

    let readyResolve!: () => void;
    this.ready = new Promise<void>(resolve => (readyResolve = resolve));

    fc.getService(serviceName)
      .then(({data: {logConfig}}: any) => {
        this.logConfig = logConfig;

        if (logConfig && options.logger !== false) {
          let {
            accessKeyID = options.accessKeyID,
            accessKeySecret = options.accessKeySecret,
            region = options.region,
          } = options.logger || {};

          this.sls = new ALY.SLS({
            accessKeyId: accessKeyID,
            secretAccessKey: accessKeySecret,
            endpoint: `http://${region}.log.aliyuncs.com`,
            apiVersion: '2015-06-01',
          });
        }

        readyResolve();
      })
      .catch(console.error);

    this.fc = fc;
  }

  async create({
    code,
    ...document
  }: Omit<ScriptDefinition, 'id' | 'token'>): Promise<Script> {
    let script = await this.request<string>({
      type: 'create',
      data: {
        ...document,
        content: await generateScriptCodeString(code),
      },
    });

    return new Script(script, this.request);
  }

  async get(id: string): Promise<Script | undefined> {
    await this.request<ScriptDefinition | undefined>({
      script: id,
      type: 'get',
      data: {
        id,
      },
    });
    return new Script(id, this.request);
  }

  async require(id: string): Promise<Script> {
    let script = await this.get(id);

    if (!script) {
      throw Error('Not found script');
    }

    return script;
  }

  private getLogs = (
    script: string,
    from: number,
    to: number,
  ): Promise<ScriptLog[]> => {
    let logConfig = this.logConfig;

    if (!logConfig) {
      throw Error('Service not include log config');
    }

    let {project, logstore} = logConfig;

    return new Promise((resolve, reject) => {
      this.sls?.getLogs(
        {
          projectName: project,
          logStoreName: logstore,
          from: Math.round(from / 1000),
          to: Math.round(to / 1000),
          topic: this.options.serviceName,
          query: `functionName=${script}`,
        },
        (error: unknown, data: any) => {
          if (error) {
            return reject(error);
          }

          resolve(
            Object.values(data.body).map(({message, __time__}: any) => ({
              message,
              time: __time__ * 1000,
            })),
          );
        },
      );
    });
  };

  private request = <T>({
    type,
    script,
    data,
  }: {
    script?: string;
    type: string;
    data: any;
  }): Promise<T> => {
    return this.ready.then(() =>
      Core[type as keyof typeof Core].call<ScriptContext, any[], any>(
        {
          script,
          fc: this.fc,
          serviceName: this.options.serviceName,
          logger: {
            getLogs: this.getLogs,
          },
        },
        data as any,
      ),
    );
  };
}
