import {Collection, Db, MongoClient} from 'mongodb';

export interface DBServiceOptions {
  uri: string;
  name: string;
}

export class DBService {
  protected db!: Db;

  readonly ready: Promise<void>;

  constructor(options: DBServiceOptions) {
    this.ready = this.initialize(options);
  }

  collection<T>(name: string): Collection<T> {
    return this.db.collection(name);
  }

  private async initialize({uri, name}: DBServiceOptions): Promise<void> {
    let client = await MongoClient.connect(uri, {
      ignoreUndefined: true,
    });

    this.db = client.db(name);

    console.info({uri, name}, 'mongodb connected');
  }
}
