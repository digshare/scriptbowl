import {ClientConfig, FCClient} from '@forker/fc2';
import ALY from 'aliyun-sdk';
import EventEmitter from 'eventemitter3';
import JSZip from 'jszip';

import {ScriptBowlEventContext} from './@context';
import {Core} from './core';
import {Script, ScriptDefinition, ScriptLog} from './script';

export type ScriptBowlEvent =
  | 'transformScriptCode'
  | 'afterExecuted'
  | 'beforeCreate'
  | 'beforeUpdate'
  | 'beforeRemove';

export interface ScriptBowlOptions extends Omit<ClientConfig, 'accessKeyID'> {
  accountId: string;
  accessKeyId: string;
  accessKeySecret: string;
  serviceName: string;
  region: string;
  logger?:
    | {
        accessKeyId?: string;
        accessKeySecret?: string;
        /**
         * 日志服务与云函数 region 不一致时需设置
         */
        region?: string;
      }
    | false;
}

export interface ScriptLogger {
  getLogs(
    script: string,
    from: number,
    to: number,
    reverse?: boolean,
  ): Promise<ScriptLog[]>;
}

export interface IScriptBowl {
  get(id: string): Promise<Script | undefined>;
  require(id: string): Promise<Script>;
  create(script: ScriptDefinition): Promise<Script>;
}

export class ScriptBowl {
  private ee = new EventEmitter<ScriptBowlEvent>();

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
    let {accountId, serviceName, accessKeyId, ...clientOptions} = options;

    let fc = new FCClient(accountId, {
      accessKeyID: accessKeyId,
      ...clientOptions,
    });

    let readyResolve!: () => void;
    this.ready = new Promise<void>(resolve => (readyResolve = resolve));

    fc.getService(serviceName)
      .then(({data: {logConfig}}: any) => {
        this.logConfig = logConfig;

        if (logConfig && options.logger !== false) {
          let {
            accessKeyId = options.accessKeyId,
            accessKeySecret = options.accessKeySecret,
            region = options.region,
          } = options.logger || {};

          this.sls = new ALY.SLS({
            accessKeyId,
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

  async create(params: ScriptDefinition): Promise<Script> {
    params = await this.request<ScriptDefinition>({
      type: 'hook',
      data: {
        type: 'beforeCreate',
        params,
      },
    });

    let {code, ...document} = params;

    let script = await this.request<string>({
      type: 'create',
      data: {
        ...document,
        content: await this.request({
          type: 'zipCode',
          data: code,
        }),
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

  on(
    event: 'transformScriptCode',
    handler: (
      this: ScriptBowlEventContext,
      zip: JSZip,
    ) => JSZip | Promise<JSZip>,
  ): void;
  on(
    event: 'beforeCreate',
    handler: (
      this: ScriptBowlEventContext,
      params: ScriptDefinition,
    ) => ScriptDefinition | Promise<ScriptDefinition>,
  ): void;
  on(
    event: 'beforeUpdate',
    handler: (
      this: ScriptBowlEventContext,
      params: Partial<ScriptDefinition>,
    ) => Partial<ScriptDefinition> | Promise<Partial<ScriptDefinition>>,
  ): void;
  on(
    event: 'beforeRemove',
    handler: (this: ScriptBowlEventContext) => void | Promise<void>,
  ): void;
  on(
    event: 'afterExecuted',
    handler: (this: ScriptBowlEventContext, data?: any) => void,
  ): void;
  on(
    event: ScriptBowlEvent,
    handler: (this: ScriptBowlEventContext, ...args: any[]) => any,
  ): void {
    this.ee.on(event, handler);
  }

  off(
    event: 'transformScriptCode',
    handler: (
      this: ScriptBowlEventContext,
      zip: JSZip,
    ) => JSZip | Promise<JSZip>,
  ): void;
  off(
    event: 'beforeCreate',
    handler: (
      this: ScriptBowlEventContext,
      params: ScriptDefinition,
    ) => ScriptDefinition | Promise<ScriptDefinition>,
  ): void;
  off(
    event: 'beforeUpdate',
    handler: (
      this: ScriptBowlEventContext,
      params: Partial<ScriptDefinition>,
    ) => Partial<ScriptDefinition> | Promise<Partial<ScriptDefinition>>,
  ): void;
  off(
    event: 'beforeRemove',
    handler: (this: ScriptBowlEventContext) => void | Promise<void>,
  ): void;
  off(
    event: 'afterExecuted',
    handler: (this: ScriptBowlEventContext, data?: any) => void,
  ): void;
  off(
    event: ScriptBowlEvent,
    handler: (this: ScriptBowlEventContext, ...args: any[]) => any,
  ): void {
    this.ee.off(event, handler);
  }

  private getLogs = (
    script: string,
    from: number,
    to: number,
    reverse = false,
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
          reverse,
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
      Core[type as keyof typeof Core].call<ScriptBowlEventContext, any[], any>(
        {
          script,
          fc: this.fc,
          serviceName: this.options.serviceName,
          ee: this.ee,
          logger: {
            getLogs: this.getLogs,
          },
        },
        data as any,
      ),
    );
  };
}
