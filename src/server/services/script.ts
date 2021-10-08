import {Collection, OptionalId} from 'mongodb';

import {DBService} from './db';

export interface ScriptDocument {
  _id: string;
  content: string;
  cron: string | undefined;
  timeout: number | undefined;
  disable: boolean;
  lastExecutedAt: number | undefined;
  /**
   * equal webhook path
   */
  token: string;
}

export class ScriptService {
  get collection(): Collection<ScriptDocument> {
    return this.db.collection<ScriptDocument>('scripts');
  }

  constructor(private db: DBService) {}

  async get(id: string): Promise<ScriptDocument | undefined> {
    let document = await this.collection.findOne({_id: id});

    return document || undefined;
  }

  async create(document: OptionalId<ScriptDocument>): Promise<string> {
    let {insertedId} = await this.collection.insertOne(document);

    console.log(insertedId);
    return insertedId;
  }

  async update(document: ScriptDocument): Promise<boolean> {
    let {matchedCount} = await this.collection.updateOne(
      {_id: document._id},
      document,
    );

    return !!matchedCount;
  }

  async delete(id: string): Promise<boolean> {
    let {deletedCount} = await this.collection.deleteOne({_id: id});

    return !!deletedCount;
  }
}
