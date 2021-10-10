import * as FS from 'fs/promises';

import {nanoid} from 'nanoid';
import tar from 'tar-stream';

import {ScriptFile} from './bowl';

export function uniqueId(): string {
  return nanoid();
}

export async function zipFiles(
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

  let promise = new Promise<string>(r => {
    let chunks: Buffer[] = [];

    pack.on('data', chunk => chunks.push(chunk));
    pack.on('end', () => {
      r(Buffer.concat(chunks).toString('binary'));
    });
  });

  pack.finalize();

  return promise;
}
