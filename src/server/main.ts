import {Entrances} from './@entrances';

const entrances = new Entrances({
  server: {
    port: 8080,
  },
  mongo: {
    uri: 'mongodb://localhost:27017',
    name: 'scriptbowl',
  },
});

entrances.ready.then(() => entrances.up()).catch(console.error);
