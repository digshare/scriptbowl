import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl('ws://localhost:8080');

  let script = await scriptBowl.create({
    entrance: 'index.js',
    files: {
      'index.js': {
        text: `#!/usr/bin/env node
        require('child_process').spawn('ls', ['-al', '/app/files']).stdout.pipe(process.stdout);
        require('child_process').spawn('cat', ['/app/files/.payload']).stdout.pipe(process.stdout);
        `,
        mode: 0o777,
      },
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
