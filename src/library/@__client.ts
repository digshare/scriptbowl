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

  // await scriptBowl.create({
  //   runtime: 'nodejs12',
  //   entrance: 'index.main',
  //   cron: '0 0 12 * * *',
  //   files: {
  //     'index.js': {
  //       text: `var getRawBody = require('raw-body')
  //       module.exports.main = function (request, response, context) {
  //           // get requset header
  //           var reqHeader = request.headers
  //           var headerStr = ' '
  //           for (var key in reqHeader) {
  //               headerStr += key + ':' + reqHeader[key] + '  '
  //           };

  //           // get request info
  //           var url = request.url
  //           var path = request.path
  //           var queries = request.queries
  //           var queryStr = ''
  //           for (var param in queries) {
  //               queryStr += param + "=" + queries[param] + '  '
  //           };
  //           var method = request.method
  //           var clientIP = request.clientIP

  //           // get request body
  //           getRawBody(request, function (err, data) {
  //               var body = data
  //               // you can deal with your own logic here

  //               // set response
  //               var respBody = new Buffer('requestHeader:' + headerStr + '\n' + 'url: ' + url + '\n' + 'path: ' + path + '\n' + 'queries: ' + queryStr + '\n' + 'method: ' + method + '\n' + 'clientIP: ' + clientIP + '\n' + 'body: ' + body + '\n')
  //               response.setStatusCode(200)
  //               response.setHeader('content-type', 'application/json')
  //               response.send(respBody)
  //           })
  //       };     `,
  //     },
  //   },
  // });

  let script = await scriptBowl.get('hbefcjjcajbjagehiiiecgifacfebdeg');

  script?.run('????????');

  // script?.disable();

  console.log('done');
})().catch(console.error);
