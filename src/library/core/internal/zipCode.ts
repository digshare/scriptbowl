import JSZip from 'jszip';

import {ScriptBowlEventContext} from '../../@context';
import {generateScriptCodeZip} from '../../@utils';
import {ScriptCode} from '../../script';

export async function zipCode(
  this: ScriptBowlEventContext,
  code: ScriptCode,
): Promise<string> {
  let zip = await generateScriptCodeZip(code);

  for (const listener of this.ee.listeners('transformScriptCode')) {
    zip = (await listener.call(this, zip)) as unknown as JSZip;
  }

  return zip.generateAsync({type: 'base64'});
}
