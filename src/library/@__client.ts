import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl('ws://localhost:8080');

  let script = await scriptBowl.create({
    content: 'foo',
  });

  let id = script.id;

  console.assert(typeof id === 'string');

  await script.update({content: 'bar'});

  await script.disable();

  await script.run();

  await script.enable();

  script = await scriptBowl.require(id);

  await script.run();

  await script.remove();

  console.assert(!(await scriptBowl.get(id)));

  script = await scriptBowl.create({
    content: 'foo',
  });
})().catch(console.error);
