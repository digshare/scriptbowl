import * as FS from 'fs/promises';

import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl('ws://localhost:8080');

  let f = await FS.readFile(__filename);

  let script = await scriptBowl.create({
    entrance: 'index.js',
    files: {
      'index.js': 'asdasdasdasdasd',
      ...Object.fromEntries(
        Array(1)
          .fill(undefined)
          .map((_, index) => [`${index}.ts`, f]),
      ),
    },
  });

  await script.run('bbbb');

  // await scriptBowl.create({
  //   cron: '*/2 * * * *',
  //   content: 'ε=ε=ε=(~￣▽￣)~ 两分钟一次',
  // });

  // let id = script.id;

  // console.assert(typeof id === 'string');

  // await script.update({content: 'bar'});

  // await script.disable();

  // await script.run();

  // await script.enable();

  // script = await scriptBowl.require(id);

  // await script.run();

  // await script.remove();

  // console.assert(!(await scriptBowl.get(id)));

  // Promise.all(
  //   Array(10)
  //     .fill(undefined)
  //     .map(() =>
  //       scriptBowl.create({
  //         cron: '*/1 * * * *',
  //         content: 'foo',
  //       }),
  //     ),
  // )
  //   .then(scripts => scripts.map((script, index) => script.run(index)))
  //   .finally(() => {});

  console.log('okey');
})().catch(console.error);
