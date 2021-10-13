import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl({
    accountId: '1301707721116229',
    accessKeyID: 'LTAI5tDR7Xg3AR34Y7TDQDDW',
    accessKeySecret: 'cY4TS0WnPfhEB6YXXtqGnmcHHjJfeT',
    region: 'cn-shenzhen',
    serviceName: 'digshare',
  });

  console.info('done', !!scriptBowl);
})().catch(console.error);
