import JSZip from 'jszip';
import {nanoid} from 'nanoid';

export function uniqueId(): string {
  return nanoid();
}

export async function zipFiles(
  files: {
    [fileName in string]: string | Buffer;
  },
  entrance: string,
): Promise<string> {
  let zip = new JSZip();
  let config = {
    entrance: undefined as string | undefined,
  };

  for (let [fileName, content] of Object.entries(files)) {
    if (fileName === entrance) {
      config.entrance = fileName;
    }

    zip.file(fileName, content);
  }

  if (!config.entrance) {
    throw Error('Entrance not found in files');
  }

  zip.file('.config', JSON.stringify(config));

  return (await zip.generateAsync({type: 'binarystring'})).toString();
}
