import {Entrances} from './@entrances';

const entrances = new Entrances({
  server: {
    port: 8080,
  },
  redis: {
    uri: 'redis://127.0.0.1:6379',
  },
  queue: {
    script: {
      concurrency: 4,
      timeout: 8000,
    },
  },
  mongo: {
    uri: 'mongodb://localhost:27017',
    name: 'scriptbowl',
  },
});

entrances.ready.then(() => entrances.up()).catch(console.error);
