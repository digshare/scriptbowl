import {FetchZipOptions, generateScriptCodeZip} from './@utils';
import {FilesScriptCode, ScriptCode} from './script';

export async function transformScriptCodeToFiles(
  code: ScriptCode,
  options?: FetchZipOptions,
): Promise<FilesScriptCode> {
  if (code.type === 'files') {
    return code;
  }

  let zip = await generateScriptCodeZip(code, options);

  let fileCode: FilesScriptCode = {
    type: 'files',
    files: {},
  };

  for (const [fileName, file] of Object.entries(zip.files)) {
    if (file.dir) {
      continue;
    }

    fileCode.files[fileName] = {
      text: await file.async('string'),
    };
  }

  return fileCode;
}
