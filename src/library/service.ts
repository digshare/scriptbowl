import {FCClient} from '@forker/fc2';

import {
  extractServiceIndexFromService,
  getRoleARN,
  markServiceNameIndex,
} from './@utils';

/**
 * 每页数量, 最大一百
 */
const REQUEST_SIZE = 100;

/**
 * 阿里云对单个 services 的限制是 50, 为增加容错我们选小一点
 */
const FUNCTION_SIZE_LIMIT = 30;

interface ServiceDefinition {
  serviceName: string;
  description: string | undefined;
  role: string;
  logConfig: {
    project: string;
    logstore: string;
    enableRequestMetrics: boolean;
    enableInstanceMetrics: boolean;
  };
  serviceId: string;
  createdTime: string;
  lastModifiedTime: string;
}

interface ServiceUsed {
  /**
   * index: Service 序列号
   */
  index: number;
  /**
   * Service 包含函数数量
   */
  count: number;
}

export interface ServicesManagerOptions {
  /**
   * 新增 service 时的选项
   */
  creation?: {
    /**
     * 能否访问公网, 默认 true
     */
    internetAccess?: boolean;
    /**
     * 授予函数计算所需权限的 RAM 角色名称, 如果要使用日志服务，需要指定包含对应权限的角色名称
     */
    roleName?: string;
    logConfig?: {
      /**
       * 日志服务中 Logstore 名称
       */
      logstore: string;
      /**
       * 日志服务中 Project 名称
       */
      project: string;
      /**
       * 是否开启请求级别指标, 默认 false
       */
      enableRequestMetrics?: boolean;
      /**
       * 日志分割规则
       */
      logBeginRule?: string;
    };
  };
}

export class ServicesManager {
  ready: Promise<any>;

  private currentMaxIndex = -1;

  /**
   * 未达到设定函数上限的 services map
   */
  private useableServicesMap: Map<number | undefined, ServiceUsed> = new Map();

  constructor(
    private fc: FCClient,
    /**
     * service 前缀名
     */
    private serviceNamePrefix: string,
    private options: ServicesManagerOptions = {},
  ) {
    this.ready = this.initialize();
  }

  /**
   * 预先消费一个名额以换取 service index
   */
  async consume(): Promise<number | undefined> {
    await this.checkUseableStatus();

    let {index} = [...this.useableServicesMap.values()][0];

    let count = await this.correctFunctionsCount(
      markServiceNameIndex(this.serviceNamePrefix, index),
      1,
    );

    this.useableServicesMap.get(index)!.count = count;

    await this.checkUseableStatus();

    return index;
  }

  /**
   * 删除函数后应当调用更新可用状态
   * @param indexedServiceName
   */
  async remand(indexedServiceName: string): Promise<void> {
    let count = await this.correctFunctionsCount(indexedServiceName);

    if (count >= FUNCTION_SIZE_LIMIT) {
      return;
    }

    let index = extractServiceIndexFromService(indexedServiceName);

    if (index === undefined) {
      // 单服务兼容数据不加入可用列表
      return;
    }

    this.useableServicesMap.set(index, {
      index,
      count,
    });
  }

  private async initialize(): Promise<void> {
    let services: ServiceDefinition[] = [];
    let nextToken: string | undefined;

    while (true) {
      let {data} = await this.fc.listServices({
        prefix: this.serviceNamePrefix,
        limit: REQUEST_SIZE,
        ...(nextToken
          ? {
              nextToken,
            }
          : {}),
      });

      let ret = Object(data);

      services.push(...(ret.services ?? []));
      nextToken = ret.nextToken;

      if (!nextToken) {
        break;
      }
    }

    await this.countServicesInfo(services);
    await this.checkUseableStatus();
  }

  /**
   * 检查 service 的可用状态
   */
  private async checkUseableStatus(): Promise<void> {
    let pendingRemoveIndex: (number | undefined)[] = [];

    for (let [index, used] of this.useableServicesMap) {
      if (used.count >= FUNCTION_SIZE_LIMIT) {
        pendingRemoveIndex.push(index);
      }
    }

    for (let index of pendingRemoveIndex) {
      this.useableServicesMap.delete(index);
    }

    if (this.useableServicesMap.size) {
      return;
    }

    // 需要新增 service

    // 重试次数
    let times = 3;

    while (times > 0) {
      try {
        this.currentMaxIndex += 1;

        let currentMaxIndex = this.currentMaxIndex;

        let serviceUsed = await this.create(currentMaxIndex);

        this.useableServicesMap.set(currentMaxIndex, serviceUsed);

        break;
      } catch (error) {
        times--;

        if (!times) {
          throw error;
        }
      }
    }
  }

  private async create(
    index: number,
    {
      internetAccess = this.options.creation?.internetAccess ?? true,
      logConfig = this.options.creation?.logConfig,
      roleName = this.options.creation?.roleName,
    }: NonNullable<ServicesManagerOptions['creation']> = {},
  ): Promise<ServiceUsed> {
    await this.fc.createService(
      markServiceNameIndex(this.serviceNamePrefix, index),
      {
        description: String(0),
        internetAccess,
        role: roleName && getRoleARN(this.fc.accountId, roleName),
        logConfig: logConfig && {
          ...logConfig,
          enableRequestMetrics: logConfig?.enableRequestMetrics ?? false,
        },
      },
    );

    return {
      index,
      count: 0,
    };
  }

  /**
   * 从 Service 信息中统计使用信息
   * @param services
   */
  private async countServicesInfo(
    services: ServiceDefinition[],
  ): Promise<void> {
    let maxIndex = this.currentMaxIndex;

    let usedList: ServiceUsed[] = [];

    for (let {serviceName, description} of services) {
      let index = extractServiceIndexFromService(serviceName);

      if (index === undefined) {
        // 单服务的兼容数据只出不进
        continue;
      }

      let count = parseInt(description || '');

      if (isNaN(count)) {
        count = await this.correctFunctionsCount(serviceName);
      }

      if (count >= FUNCTION_SIZE_LIMIT) {
        continue;
      }

      usedList.push({
        index,
        count,
      });

      maxIndex = Math.max(maxIndex, index);
    }

    usedList = usedList.sort((ua, ub) => ua.index - ub.index);

    for (let used of usedList) {
      this.useableServicesMap.set(used.index, used);
    }

    this.currentMaxIndex = maxIndex;
  }

  /**
   * 矫正 service 函数数量
   * @param indexedServiceName
   */
  private async correctFunctionsCount(
    indexedServiceName: string,
    offset = 0,
  ): Promise<number> {
    let {data} = await this.fc.listFunctions(indexedServiceName, {
      limit: REQUEST_SIZE,
    });

    let {functions} = Object(data);

    let count =
      (Array.isArray(functions) ? functions.length : Infinity) + offset;

    await this.fc.updateService(indexedServiceName, {
      description: String(Math.min(count, FUNCTION_SIZE_LIMIT)),
    });

    return count;
  }
}
