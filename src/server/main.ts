import {Entrances} from './@entrances';

const entrances = new Entrances({
  server: {
    port: 8080,
  },
  docker: {
    image: 'sbt',
  },
  queue: {
    script: {
      concurrency: 10,
      timeout: 20000,
    },
  },
  redis: {
    uri: 'redis://127.0.0.1:6379',
  },
  mongo: {
    uri: 'mongodb://localhost:27017',
    name: 'scriptbowl',
  },
});

entrances.ready.then(() => entrances.up()).catch(console.error);
