import * as ChildProcess from 'child_process';
import * as Path from 'path';
import {Readable} from 'stream';
import * as Zlib from 'zlib';

import * as FS from 'fs-extra';
import tar from 'tar-stream';

let input = Buffer.allocUnsafe(0);

let zipLength = 0;
let payloadLength = 0;
let totalLength = 0;

async function main(): Promise<void> {
  let entrance = await getEntrancePath();

  let child = ChildProcess.spawn(entrance);

  child.on('exit', code => process.exit(code ?? 0));

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
}

process.stdin.on('data', async chunk => {
  try {
    const headerSize = 8;

    input = Buffer.concat([input, chunk]);

    if (!totalLength) {
      let header = input.slice(0, headerSize);

      zipLength = header.readUInt32BE(0);
      payloadLength = header.readUInt32BE(4);

      totalLength = headerSize + zipLength + payloadLength;
    }

    if (input.length !== totalLength) {
      return;
    }

    await unzip(input.slice(headerSize, zipLength + headerSize));

    await savePayload(input.slice(headerSize + zipLength));

    await main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

async function unzip(zipData: Buffer): Promise<void> {
  let decodeZipData = await new Promise<Buffer>(resolve => {
    Zlib.brotliDecompress(zipData, (_, buffer) => resolve(buffer));
  });

  let pack = Readable.from(decodeZipData);
  let extract = tar.extract();

  let resolve: (() => void) | undefined;

  extract.on('entry', (header, stream, next) => {
    let chunks: Buffer[] = [];

    let handle = (chunk: Buffer): number => chunks.push(chunk);

    stream.on('data', handle);

    stream.on('end', async () => {
      stream.off('data', handle);

      await FS.outputFile(getFilePath(header.name), Buffer.concat(chunks), {
        ...(header.mode
          ? {
              mode: header.mode,
            }
          : {}),
      });

      next();
    });

    stream.resume();
  });

  extract.on('finish', function () {
    resolve!();
  });

  pack.pipe(extract);

  return new Promise<void>(r => (resolve = r));
}

async function savePayload(payloadData: Buffer): Promise<void> {
  return FS.outputFile(getFilePath('.payload'), payloadData);
}

async function getEntrancePath(): Promise<string> {
  let {entrance} = JSON.parse(
    (await FS.readFile(getFilePath('.config'))).toString(),
  );

  return getFilePath(entrance);
}

function getFilePath(path: string): string {
  return Path.join(process.env.FILESDIR!, path);
}
