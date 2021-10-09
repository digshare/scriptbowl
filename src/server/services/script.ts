import {Collection, ObjectId} from 'mongodb';

import {DBService} from './db';

export interface ScriptDocument {
  _id: ObjectId;
  content: string;
  cron: string | undefined;
  timeout: number | undefined;
  lastExecutedAt: number | undefined;
  disable: boolean;
  /**
   * equal webhook path
   */
  token: string;
}

export interface ScriptClientDocument {
  id: string;
  content: string;
  token: string;
  cron?: string;
  timeout?: number;
  disable?: boolean;
}

export class ScriptService {
  get collection(): Collection<ScriptDocument> {
    return this.db.collection<ScriptDocument>('scripts');
  }

  constructor(private db: DBService) {}

  async get(id: string): Promise<ScriptClientDocument | undefined> {
    let document = await this.collection.findOne({_id: new ObjectId(id)});

    return document ? coverScriptDocument(document) : undefined;
  }

  async match(token: string): Promise<ScriptDocument | undefined> {
    let document = await this.collection.findOne({token});

    return document || undefined;
  }

  async create(
    document: Omit<ScriptDocument, '_id'>,
  ): Promise<ScriptClientDocument> {
    let {insertedId} = await this.collection.insertOne(
      document as unknown as ScriptDocument,
    );

    return coverScriptDocument({...document, _id: insertedId});
  }

  async update(
    id: string,
    document: Partial<ScriptDocument>,
  ): Promise<boolean> {
    let {matchedCount} = await this.collection.updateOne(
      {_id: new ObjectId(id)},
      {
        $set: document,
      },
    );

    return !!matchedCount;
  }

  async delete(id: string): Promise<boolean> {
    let {deletedCount} = await this.collection.deleteOne({
      _id: new ObjectId(id),
    });

    return !!deletedCount;
  }
}

function coverScriptDocument({
  _id,
  content,
  token,
  cron,
  timeout,
  disable,
}: ScriptDocument): ScriptClientDocument {
  return {
    id: _id.toHexString(),
    content,
    cron,
    timeout,
    disable,
    token,
  };
}
