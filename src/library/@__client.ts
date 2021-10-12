import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl({
    accountId: '1301707721116229',
    accessKeyID: 'LTAI5tDR7Xg3AR34Y7TDQDDW',
    accessKeySecret: 'cY4TS0WnPfhEB6YXXtqGnmcHHjJfeT',
    region: 'cn-shenzhen',
    serviceName: 'digshare',
  });

  let script = await scriptBowl.get('6164043b1bcb1674cc7f2051');

  await script!.run(666);

  console.log('done');
})().catch(console.error);
