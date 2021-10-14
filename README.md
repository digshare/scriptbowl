# scriptbowl

本质上是对 阿里云-函数计算 (FC) API 的封装

### Class

#### ScriptBowl

##### constructor(options: ScriptBowlOptions)

创建 scriptbowl 实例

```typescript
new ScriptBowl({
  accountId: '<AccountId>',
  accessKeyID: '<AccessKeyID>',
  accessKeySecret: '<AccessKeySecret>',
  region: '<Region>',
  serviceName: '<ServiceName>',
  // other options ...
});
```

##### get(id: string): Promise<Script | undefined>

通过 ID 获取脚本

##### require(id: string): Promise<Script\>

`get` 的封装, 脚本不存在将抛出错误

##### create(script: ScriptDefinition): Promise<Script\>

创建脚本

##### on(event: ScriptBowlEvent, handler): void

监听 scriptbowl 生命周期事件, 事件函数 `this` 默认指向 `ScriptContext`

event 类型有:

- `transformScriptCode` 创建脚本时，对脚本 zip 包进行预处理, 返回处理后的 zip 包

- `afterExecuted` 脚本执行后的返回值

- `beforeCreate` 脚本创建前，可改变创建脚本将使用的 ScriptDefinition

- `beforeUpdate` 脚本更新前

- `beforeRemove` 脚本移除前

##### off(event: ScriptBowlEvent, handler): void

解除绑定

#### Script

通过 scriptbowl 取得的脚本

##### update(params: Partial<ScriptDefinition\>): Promise<void\>

更新脚本

##### run(payload?: any): Promise<any\>

执行脚本

##### enable(): Promise<void\>

启用脚本

##### disable(): Promise<void\>

禁用脚本

##### remove(): Promise<void\>

移除脚本

##### getLogs(from:number, to?: number): Promise<ScriptLog\>

获取脚本执行日志, 如获取最近一分钟的日志 `script.getLogs(Date.now - 60 * 1000)`

- from 起始时间
- to 截至时间，默认 `Date.now()`

### Types

#### ScriptDefinition

脚本定义内容

```typescript
interface ScriptDefinition<TMeta extends any = any> {
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
  cron?: string;
  /**
   * 执行超时时间（秒）
   */
  timeout?: number;
  disable?: boolean;
  meta?: TMeta;
}
```

#### ScriptCode

脚本文件支持的类型

##### FilesScriptCode

通过对象声明脚本文件

```typescript
interface FilesScriptCode {
  type: 'files';
  files: {
    [fileName: string]: ScriptFile;
  };
}
type ScriptFile =
  | string // 文件路径
  | ScriptFileDeclare;

interface ScriptFileDeclare {
  text: string;
  /**
   * @deprecated zip 后会丢失 mode
   */
  mode?: number;
}
```

##### DirectoryScriptCode

指定本机文件夹作为脚本文件

```typescript
export interface DirectoryScriptCode {
  type: 'directory';
  directory: string; // 文件夹路径
}
```

##### ZipScriptCode

指定本地或网络 zip 包作为脚本文件

```typescript
export interface ZipScriptCode {
  type: 'local-zip' | 'remote-zip';
  zipPath: string; // 本地或远程 zip 包地址
}
```

##### GithubScriptCode

指定 Github 仓库作为脚本文件 （暂只支持公开仓库）

- owner 作者名
- project 仓库名
- branch 分支名, 默认 `main`

```typescript
export interface GithubScriptCode {
  type: 'github';
  owner: string;
  project: string;
  /**
   * default: main
   */
  branch?: string;
}
```

#### ScriptLog

脚本日志内容

```typescript
interface ScriptLog {
  message: string;
  time: number;
}
```

#### ScriptRuntime

脚本执行环境

- nodejs10

- nodejs12

- python2.7

- python3

- java8

- java11

- php7.2
- 自定义

### 使用步骤

1. 在 [阿里云创建服务](https://fcnext.console.aliyun.com/cn-shenzhen/services) (如需 get 脚本执行日志请在创建时启用日志功能)
2. 进入服务详情, 复制必要信息待用 (点击字段右侧有复制按钮)
   1. 基础信息-地域
   2. 日志配置-日志项目
   3. 日志配置-日志仓库
   4. 点击 日志配置-日志项目 链接, 查看日志项目所属地域是否与服务一致，如不一致请记录待用，一致可忽略
3. 实例化 scriptbowl

```typescript
const scriptbowl = new ScriptBowl({
  accountId: '<AccountId>',
  accessKeyID: '<AccessKeyID>',
  accessKeySecret: '<AccessKeySecret>',
  region: '<Region>',
  serviceName: '<ServiceName>',
  // 如 log region 不一致
  logger: {
    region: '<LogRegion>',
  },
});
```

- [accountId](https://fcnext.console.aliyun.com/overview) （右侧 常用信息-主账号 ID）
- [accessKeyID & accessKeySecret](https://ram.console.aliyun.com/manage/ak)

## License

MIT License.
