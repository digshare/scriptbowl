import {ScriptBowl} from './bowl';

(async () => {
  const scriptBowl = new ScriptBowl({
    accountId: '1301707721116229',
    accessKeyID: 'LTAI5tDR7Xg3AR34Y7TDQDDW',
    accessKeySecret: 'cY4TS0WnPfhEB6YXXtqGnmcHHjJfeT',
    region: 'cn-shenzhen',
    serviceName: 'digshare',
  });

  scriptBowl.on('beforeCreate', async function (definition) {
    console.log('beforeCreate', definition);

    return definition;
  });

  scriptBowl.on('beforeUpdate', async function (definition) {
    console.log('beforeUpdate', definition);

    return definition;
  });

  scriptBowl.on('beforeRemove', async function () {
    console.log('beforeRemove', this.script);
  });

  scriptBowl.on('afterExecuted', async function (data) {
    console.log('afterExecuted', data);
  });

  let script = await scriptBowl.create({
    runtime: 'nodejs12',
    code: {
      type: 'directory',
      directory: __dirname,
    },
    entrance: 'asdasd',
  });

  await script.run('six six six');

  await script.update({
    disable: true,
  });

  script = await scriptBowl.require('gidfhieieaababejjehikaeceggcfdgj');

  await script.remove();

  console.info('done', !!scriptBowl);
})().catch(console.error);
