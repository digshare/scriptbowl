# scriptbowl

本质上是对 [阿里云-函数计算 (FC)](https://fcnext.console.aliyun.com/overview) [API](https://help.aliyun.com/document_detail/51883.html) 的封装

## ScriptBowl

### constructor(options: ScriptBowlOptions)

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

### get(id)

通过 ID 获取脚本

### require(id)

`get` 的封装, 脚本不存在将抛出错误

### create(definition)

创建脚本

### on(event, handler)

监听 scriptbowl 生命周期事件, 事件函数 `this` 默认指向 `ScriptBowlEventContext`

event 类型有:

- `transformScriptCode` 创建脚本时，对脚本 zip 包进行预处理, 返回处理后的 zip 包

- `afterExecuted` 脚本执行后的返回值

- `beforeCreate` 脚本创建前，可改变创建脚本将使用的 ScriptDefinition

- `beforeUpdate` 脚本更新前

- `beforeRemove` 脚本移除前

### off(event, handler)

解除绑定

## Script

通过 scriptbowl 取得的脚本

### update(definition)

更新脚本

### run(payload)

执行脚本

### enable()

启用脚本

### disable()

禁用脚本

### remove()

移除脚本

### getLogs(from, to?)

获取脚本执行日志, 如获取最近一分钟的日志 `script.getLogs(Date.now - 60 * 1000)`

- from 起始时间
- to 截至时间，默认 `Date.now()`

## Types

### ScriptDefinition

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

### ScriptCode

脚本文件支持的类型

#### FilesScriptCode

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

#### DirectoryScriptCode

指定本机文件夹作为脚本文件

```typescript
export interface DirectoryScriptCode {
  type: 'directory';
  directory: string; // 文件夹路径
}
```

#### ZipScriptCode

指定本地或网络 zip 包作为脚本文件

```typescript
export interface ZipScriptCode {
  type: 'local-zip' | 'remote-zip';
  zipPath: string; // 本地或远程 zip 包地址
}
```

#### GithubScriptCode

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

### ScriptLog

脚本日志内容

```typescript
interface ScriptLog {
  message: string;
  time: number;
}
```

### ScriptBowlEventContext

scriptbowl 事件执行上下文

```typescript
interface ScriptBowlEventContext {
  serviceName: string;
  script: string | undefined;
  fc: FCClient;
  ee: EventEmitter<ScriptBowlEvent>;
  logger: ScriptLogger;
}
```

### ScriptRuntime

创建脚本时可选择的执行环境

- nodejs10

- nodejs12

- python2.7

- python3

- java8

- java11

- php7.2
- 自定义

## 使用步骤

1. 在 [阿里云创建服务](https://fcnext.console.aliyun.com/cn-shenzhen/services) (如需获取脚本执行日志请在创建时启用日志功能)
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

## 阿里云权限

建议的最小权限

- RAM 用户权限策略

```json
{
  "Version": "1",
  "Statement": [
    {
      "Action": ["log:Get*", "log:List*"],
      "Resource": "acs:log:<地区>:*:project/<日志项目>/logstore/<日志仓库>",
      "Effect": "Allow"
    },
    {
      "Action": "fc:GetService",
      "Resource": "acs:fc:<地区>:*:services/<服务名称>",
      "Effect": "Allow"
    },
    {
      "Action": "fc:*",
      "Resource": "acs:fc:<地区>:*:services/<服务名称>/functions/*",
      "Effect": "Allow"
    }
  ]
}
```

- 云函数服务角色权限策略

```json
{
  "Version": "1",
  "Statement": [
    {
      "Action": ["log:PostLogStoreLogs"],
      "Resource": "acs:log:<地区>:*:project/<日志项目>/logstore/<日志仓库>",
      "Effect": "Allow"
    }
  ]
}
```

## License

MIT License.
