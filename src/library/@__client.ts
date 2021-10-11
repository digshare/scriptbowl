import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl('ws://localhost:8080');

  let script = await scriptBowl.get('6164043b1bcb1674cc7f2051');

  await script!.run(666);

  //   let script = await scriptBowl.create({
  //     entrance: 'index.js',
  //     files: {
  //       'index.js': {
  //         text: `#!/usr/bin/env ds-javascript
  // import fn from './test.js';

  // export default function (payload) {
  //   if(payload > 50) {
  //     console.log(payload, "!!, 你传的居然是 ", payload);
  //   } else {
  //     console.error(payload, "??,你看不起谁呢");
  //   }
  //   console.log(fn());
  // }

  //         `,
  //         mode: 0o777,
  //       },
  //       'test.js': {
  //         text: `
  // export default function () {
  //   return "我是 test.js"
  // }

  //         `,
  //       },
  //     },
  //   });

  //   console.log(script.id);

  // await script.run(666);

  console.log('done');
})().catch(console.error);
