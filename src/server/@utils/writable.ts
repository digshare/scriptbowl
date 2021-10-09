import {Stream} from 'stream';

export class StringWritable extends Stream.Writable {
  private chunks: Buffer[] = [];

  constructor() {
    super({
      write: (chunk, _encoding, callback) => {
        this.chunks.push(chunk);
        callback();
      },
    });
  }

  async end(): Promise<string> {
    super.end();

    return new Promise(resolve => {
      this.once('finish', () => {
        resolve(Buffer.concat(this.chunks).toString('utf-8').trim());
      });
    });
  }
}
