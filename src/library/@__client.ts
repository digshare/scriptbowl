import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl({
    accountId: '1301707721116229',
    accessKeyID: 'LTAI5tDR7Xg3AR34Y7TDQDDW',
    accessKeySecret: 'cY4TS0WnPfhEB6YXXtqGnmcHHjJfeT',
    region: 'cn-shenzhen',
    serviceName: 'digshare',
  });

  // scriptBowl.fc.getFunction('digshare', 'test').then(console.log);

  // let script = await scriptBowl.get('6164043b1bcb1674cc7f2051');

  // await script!.run(666);

  // ehdhajkbibgejkfiachigkhfdhccbjfe

  // await scriptBowl.create({
  //   runtime: 'nodejs12',
  //   entrance: 'index.main',
  //   cron: '0 0 12 * * *',
  //   files: {
  //     'index.js': {
  //       text: `exports.main = (req, resp, context) => {console.log('hello world');}`,
  //     },
  //   },
  // });

  let script = await scriptBowl.get('ehdhajkbibgejkfiachigkhfdhccbjfe');

  script?.run('????????');

  console.log('done');
})().catch(console.error);
