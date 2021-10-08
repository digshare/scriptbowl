import {Db, MongoClient} from 'mongodb';

export class DBService {
  readonly db: Db;

  constructor(uri: string, name: string) {
    let client = new MongoClient(uri);

    this.db = client.db(name);
  }
}
