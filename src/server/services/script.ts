import {Binary, Collection, ObjectId} from 'mongodb';

import {DBService} from './db';
import {ScriptQueueService} from './queues';

export interface ScriptDocument {
  _id: ObjectId;
  entrance: string;
  content: Binary;
  cron: string | undefined;
  timeout: number | undefined;
  nextExecuteAt: number | undefined;
  disable: boolean;
  /**
   * equal webhook path
   */
  token: string;
}

export interface ScriptClientDocument {
  id: string;
  entrance: string;
  token: string;
  cron?: string;
  timeout?: number;
  disable?: boolean;
}

export class ScriptService {
  get collection(): Collection<ScriptDocument> {
    return this.dbService.collection<ScriptDocument>('scripts');
  }

  constructor(
    private dbService: DBService,
    private scriptQueueService: ScriptQueueService,
  ) {}

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
        $set: {...document},
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

  async run(script: ScriptDocument, payload?: any): Promise<void> {
    await this.scriptQueueService.addJob({script, payload});
  }
}

function coverScriptDocument({
  _id,
  entrance,
  token,
  cron,
  timeout,
  disable,
}: ScriptDocument): ScriptClientDocument {
  return {
    id: _id.toHexString(),
    entrance,
    cron,
    timeout,
    disable,
    token,
  };
}
