import {ClientConfig, FCClient} from '@forker/fc2';
import ALY from 'aliyun-sdk';
import EventEmitter from 'eventemitter3';
import JSZip from 'jszip';

import {ScriptBowlEventContext} from './@context';
import {extractServiceIndexFromScript, markServiceNameIndex} from './@utils';
import {Core} from './core';
import {Script, ScriptDefinition, ScriptLog} from './script';
import {ServicesManager, ServicesManagerOptions} from './service';

export type ScriptBowlEvent =
  | 'transformScriptCode'
  | 'afterExecuted'
  | 'beforeCreate'
  | 'beforeUpdate'
  | 'beforeRemove'
  | 'afterRemove';

export interface ScriptBowlOptions extends Omit<ClientConfig, 'accessKeyID'> {
  accountId: string;
  accessKeyId: string;
  accessKeySecret: string;
  serviceName: string;
  region: string;
  /**
   * 多服务模式
   * 自动创建管理 service, 需要更多权限
   */
  multiServices?: ServicesManagerOptions | true;
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
  readonly ready: Promise<any>;

  private ee = new EventEmitter<ScriptBowlEvent>();

  private readonly fc: FCClient;

  private readonly sm: ServicesManager | undefined;

  constructor(private readonly options: ScriptBowlOptions) {
    let {accountId, serviceName, accessKeyId, multiServices, ...clientOptions} =
      options;

    let fc = new FCClient(accountId, {
      accessKeyID: accessKeyId,
      ...clientOptions,
    });

    let sm: ServicesManager | undefined;

    if (multiServices) {
      sm = new ServicesManager(
        fc,
        serviceName,
        typeof multiServices === 'boolean' ? {} : multiServices,
      );

      this.on('afterRemove', function () {
        return sm!.remand(this.serviceName);
      });
    }

    this.ready = sm ? sm.ready : fc.getService(serviceName);

    this.fc = fc;
    this.sm = sm;
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
    try {
      return await this.require(id);
    } catch (error) {
      return undefined;
    }
  }

  async require(id: string): Promise<Script> {
    await this.request<ScriptDefinition | undefined>({
      script: id,
      type: 'get',
      data: {
        id,
      },
    });

    return new Script(id, this.request);
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
    event: 'beforeRemove' | 'afterRemove',
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
    event: 'beforeRemove' | 'afterRemove',
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
    return new Promise(async (resolve, reject) => {
      let serviceName = await this.getServiceName(script);

      let {logConfig} = Object((await this.fc.getService(serviceName)).data);

      if (!logConfig) {
        throw Error('Service not include log config');
      }

      let options = this.options;
      let {
        accessKeyId = options.accessKeyId,
        accessKeySecret = options.accessKeySecret,
        region = options.region,
      } = options.logger || {};

      let sls = new ALY.SLS({
        accessKeyId,
        secretAccessKey: accessKeySecret,
        endpoint: `http://${region}.log.aliyuncs.com`,
        apiVersion: '2015-06-01',
      });

      let {project, logstore} = logConfig;

      sls.getLogs(
        {
          projectName: project,
          logStoreName: logstore,
          from: Math.round(from / 1000),
          to: Math.round(to / 1000),
          topic: serviceName,
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
    return this.ready.then(async () => {
      let serviceName = await this.getServiceName(script);

      return Core[type as keyof typeof Core].call<
        ScriptBowlEventContext,
        any[],
        any
      >(
        {
          script,
          serviceName,
          fc: this.fc,
          ee: this.ee,
          logger: {
            getLogs: this.getLogs,
          },
        },
        data as any,
      );
    });
  };

  private async getServiceName(scriptId: string | undefined): Promise<string> {
    let {serviceName, multiServices} = this.options;

    if (!multiServices) {
      return serviceName;
    }

    // 除了新增脚本，其他情况都会有 scriptId
    return markServiceNameIndex(
      serviceName,
      scriptId
        ? extractServiceIndexFromScript(scriptId)
        : await this.sm!.consume(),
    );
  }
}
