import * as ChildProcess from 'child_process';
import * as Path from 'path';

import * as FS from 'fs-extra';
import JSZip from 'jszip';

let filesDir = Path.join(__dirname, '../files');

let input = Buffer.allocUnsafe(0);

let zipLength = 0;
let payloadLength = 0;
let totalLength = 0;

function main(_payload: any): void {
  let child = ChildProcess.spawn('ls', ['-al', filesDir]);

  child.on('exit', () => process.exit());

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

    let payload = await extractPayload(input.slice(headerSize + zipLength));

    main(payload);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

async function unzip(zipData: Buffer): Promise<void[]> {
  let zip = new JSZip();

  await zip.loadAsync(zipData);

  let promiseList: Promise<any>[] = [];

  zip.forEach((path, file) =>
    promiseList.push(
      file.async('nodebuffer').then(buffer => {
        if (!buffer.length) {
          // dir
          return;
        }

        return FS.outputFile(Path.join(filesDir, path), buffer);
      }),
    ),
  );

  return Promise.all(promiseList);
}

async function extractPayload(payloadData: Buffer): Promise<any> {
  return JSON.parse(payloadData.toString()).payload;
}
