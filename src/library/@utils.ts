import * as FS from 'fs/promises';
import * as Zlib from 'zlib';

import cronParser from 'cron-parser';
import JSZip from 'jszip';
import {customAlphabet} from 'nanoid';
import tar from 'tar-stream';

import {ScriptFile} from './bowl';

const nanoid = customAlphabet('abcdefghijk', 32);

export function uniqueId(): string {
  return nanoid();
}

export function getFunctionName(
  scriptId: string,
  type: 'http' | 'timer',
): string {
  return `${scriptId}-${type}`;
}

export function parseNextTime(cron: string): number {
  return cronParser.parseExpression(cron).next().getTime();
}

export async function tarFiles(
  files: {
    [fileName in string]: ScriptFile;
  },
  entrance: string,
): Promise<string> {
  let pack = tar.pack();

  let config = {
    entrance: undefined as string | undefined,
  };

  for (let [fileName, content] of Object.entries(files)) {
    if (fileName === entrance) {
      config.entrance = fileName;
    }

    let text: string | Buffer;
    let mode: number | undefined;

    if (typeof content === 'string') {
      text = await FS.readFile(content);

      mode = parseInt(
        // eslint-disable-next-line no-bitwise
        `0${((await FS.stat(content)).mode & 0o777).toString(8)}`,
        8,
      );
    } else {
      ({text, mode} = content);
    }

    pack.entry({name: fileName, mode}, text);
  }

  if (!config.entrance) {
    throw Error('Entrance not found in files');
  }

  pack.entry({name: '.config'}, JSON.stringify(config));

  let promise = new Promise<string>(resolve => {
    let chunks: Buffer[] = [];

    pack.on('data', chunk => chunks.push(chunk));
    pack.on('end', () => {
      Zlib.brotliCompress(Buffer.concat(chunks), (_, buffer) => {
        resolve(buffer.toString('binary'));
      });
    });
  });

  pack.finalize();

  return promise;
}

export async function zipFiles(files: {
  [fileName in string]: ScriptFile;
}): Promise<string> {
  let zip = new JSZip();

  for (let [fileName, content] of Object.entries(files)) {
    if (typeof content === 'string') {
      zip.file(fileName, await FS.readFile(content));
    } else {
      zip.file(fileName, content.text);
    }
  }

  return (await zip.generateAsync({type: 'base64'})).toString();
}
