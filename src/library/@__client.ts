import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl('ws://localhost:8080');

  // 测试并发
  await Promise.all(
    Array(10)
      .fill(undefined)
      .map(() => scriptBowl.get('616140d74c8e1e279f1fdc71')),
  ).then(scripts => scripts.forEach(script => script?.run()));

  // await scriptBowl.create({
  //   cron: '*/2 * * * *',
  //   content: 'ε=ε=ε=(~￣▽￣)~ 两分钟一次',
  // });

  // let script = await scriptBowl.create({
  //   content: 'foo',
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
