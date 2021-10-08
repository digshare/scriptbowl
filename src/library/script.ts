export interface ScriptDocument {
  content: string;
  /**
   * 定时执行 cron 表达式
   */
  cron: string | undefined;
  /**
   * 执行超时时间
   */
  timeout: number | undefined;
}

export class Script {
  constructor(readonly id: string) {}

  update(): void {}

  async run(): Promise<void> {}

  async enable(): Promise<boolean> {
    return true;
  }

  async disable(): Promise<boolean> {
    return true;
  }

  async remove(): Promise<boolean> {
    return true;
  }

  async getLog(): Promise<string> {
    return '';
  }

  async getLogStream(): Promise<Buffer> {
    return Buffer.from('');
  }
}
