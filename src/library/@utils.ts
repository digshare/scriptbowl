import * as FS from 'fs/promises';
import * as Path from 'path';

import {TriggerConfig} from '@forker/fc2';
import {HttpsProxyAgent} from 'https-proxy-agent';
import JSZip from 'jszip';
import {customAlphabet} from 'nanoid';
import fetch from 'node-fetch';

import {
  DirectoryScriptCode,
  FilesScriptCode,
  GithubScriptCode,
  ScriptCode,
  ScriptCron,
} from './script';

const SCRIPT_HEAD_CHAR = 'f';
const SERVICE_INDEX_STRING_LENGTH = 4;

const scriptId = customAlphabet('opqrstuvwxyz', 8);

function hexIndex(index: number): string {
  let hexIndexString = index.toString(16);

  if (hexIndexString.length > SERVICE_INDEX_STRING_LENGTH) {
    throw Error(
      `Services index cannot max than \`${Array(SERVICE_INDEX_STRING_LENGTH)
        .fill('F')
        .join('')}\``,
    );
  }

  return `${Array(SERVICE_INDEX_STRING_LENGTH)
    .fill(0)
    .join('')}${hexIndexString}`.slice(-SERVICE_INDEX_STRING_LENGTH);
}

export function createScriptId(serviceName: string): string {
  let serviceIndex = extractServiceIndexFromService(serviceName);

  // length 1+ (0 | SERVICE_INDEX_STRING_LENGTH) + 8
  return `${SCRIPT_HEAD_CHAR}${
    serviceIndex !== undefined ? hexIndex(serviceIndex) : ''
  }${scriptId()}`;
}

export function extractServiceIndexFromScript(
  scriptId: string,
): number | undefined {
  let index = parseHex(
    scriptId.slice(
      SCRIPT_HEAD_CHAR.length,
      SCRIPT_HEAD_CHAR.length + SERVICE_INDEX_STRING_LENGTH,
    ),
  );

  return !isNaN(index) ? index : undefined;
}

export function extractServiceIndexFromService(
  serviceName: string,
): number | undefined {
  let hexIndex = serviceName.split('-')[1];

  if (!hexIndex) {
    return undefined;
  }

  let index = parseHex(hexIndex);

  return !isNaN(index) ? index : undefined;
}

export function markServiceNameIndex(
  serviceName: string,
  index: number | undefined,
): string {
  if (index === undefined) {
    return serviceName;
  }

  return `${serviceName}-${hexIndex(index)}`;
}

export function getRoleARN(accountId: string, roleName: string): string {
  return `acs:ram::${accountId}:role/${roleName.toLowerCase()}`;
}

export interface FetchZipOptions {
  proxyAgent?: HttpsProxyAgent | string;
}

export async function generateScriptCodeZip(
  code: ScriptCode,
  options: FetchZipOptions = {},
): Promise<JSZip> {
  let zip: JSZip;

  switch (code.type) {
    case 'files':
      zip = await zipFiles(code);
      break;
    case 'directory':
      zip = await zipDirectory(code);
      break;
    case 'github':
      zip = await fetchGithubCode(code, options);
      break;
    case 'local-zip':
      zip = await readZipFile(code.zipPath);
      break;
    case 'remote-zip':
      zip = await fetchZipFile(code.zipPath, options);
      break;
    case 'js-zip':
      zip = code.zip;
  }

  return zip;
}

export async function zipFiles({files}: FilesScriptCode): Promise<JSZip> {
  let zip = new JSZip();

  for (let [fileName, content] of Object.entries(files)) {
    if (typeof content === 'string') {
      zip.file(fileName, await FS.readFile(content));
    } else {
      zip.file(fileName, content.text);
    }
  }

  return zip;
}

export async function fetchGithubCode(
  {owner, project, branch = 'main'}: GithubScriptCode,
  options: FetchZipOptions,
): Promise<JSZip> {
  return fetchZipFile(
    `https://github.com/${owner}/${project}/archive/refs/heads/${branch}.zip`,
    options,
  );
}

export async function fetchZipFile(
  url: string,
  options: FetchZipOptions,
): Promise<JSZip> {
  return fetch(url, {
    ...(options.proxyAgent
      ? {
          agent:
            typeof options.proxyAgent === 'string'
              ? new HttpsProxyAgent(options.proxyAgent)
              : options.proxyAgent,
        }
      : {}),
  })
    .then(res => res.buffer())
    .then(buffer => new JSZip().loadAsync(buffer));
}

export async function readZipFile(path: string): Promise<JSZip> {
  return FS.readFile(path).then(buffer => new JSZip().loadAsync(buffer));
}

// https://github.com/Stuk/jszip/issues/386#issuecomment-634773343
export async function zipDirectory({
  directory,
}: DirectoryScriptCode): Promise<JSZip> {
  let allPaths = await getFilePathsRecursively(directory);

  let zip = new JSZip();

  for (let filePath of allPaths) {
    // Fix in windows
    let addPath = Path.relative(directory, filePath).split(Path.sep).join('/');
    let data = await FS.readFile(filePath);
    let stat = await FS.lstat(filePath);
    let permissions = stat.mode;

    if (stat.isSymbolicLink()) {
      zip.file(addPath, await FS.readlink(filePath), {
        unixPermissions: parseInt('120755', 8), // This permission can be more permissive than necessary for non-executables but we don't mind.
        dir: stat.isDirectory(),
      });
    } else {
      zip.file(addPath, data, {
        unixPermissions: permissions,
        dir: stat.isDirectory(),
      });
    }
  }

  return zip;

  async function getFilePathsRecursively(dir: string): Promise<string[]> {
    // returns a flat array of absolute paths of all files recursively contained in the dir
    let results: string[] = [];
    let list = await FS.readdir(dir);

    let pending = list.length;

    if (!pending) {
      return results;
    }

    for (let file of list) {
      file = Path.resolve(dir, file);

      let stat = await FS.lstat(file);

      if (stat && stat.isDirectory()) {
        results.push(...(await getFilePathsRecursively(file)));
      } else {
        results.push(file);
      }

      if (!--pending) {
        return results;
      }
    }

    return results;
  }
}

export function isSameScriptCron(
  cronA: ScriptCron | undefined,
  cronB: ScriptCron | undefined,
): boolean {
  try {
    if (typeof cronA === 'string' || typeof cronA === 'undefined') {
      return cronA === cronB;
    } else {
      return (
        typeof cronB === 'object' &&
        cronA.expression === cronB.expression &&
        JSON.stringify(cronA.payload) === JSON.stringify(cronB.payload)
      );
    }
  } catch (error) {
    return false;
  }
}

export function payloadToString(payload: any): string {
  return JSON.stringify(payload);
}

export function buildTriggerConfig(cron: ScriptCron): TriggerConfig {
  let cronExpression: string;
  let cronPayload: any;

  if (typeof cron === 'string') {
    cronExpression = cron;
  } else {
    cronExpression = cron.expression;
    cronPayload = payloadToString(cron.payload);
  }

  return {
    payload: cronPayload,
    cronExpression,
    enabled: true,
  };
}

function parseHex(hex: string): number {
  let int = parseInt(hex, 16);

  if (hexIndex(int) === hex) {
    return int;
  }

  return NaN;
}
