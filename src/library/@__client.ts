import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl('ws://localhost:8080');

  let script = await scriptBowl.create({
    entrance: 'index.js',
    files: {
      'index.js': {
        text: `#!/usr/bin/env ds-javascript
import fn from './test.js';

export default function (payload) {
  console.log(payload);
  console.log(fn());
}

        `,
        mode: 0o777,
      },
      'test.js': {
        text: `
export default function () {
  console.log("???");

  return 888
}

        `,
      },
    },
  });

  await script.run(666);

  console.log('done');
})().catch(console.error);
