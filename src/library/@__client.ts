import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl('ws://localhost:8080');

  const script = await scriptBowl.create({
    content: '?',
    cron: undefined,
    timeout: undefined,
  });

  await script.run();
})().catch(console.error);
