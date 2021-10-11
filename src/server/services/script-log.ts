import {Stream} from 'stream';

import {Collection, ObjectId} from 'mongodb';

import {DBService} from './db';

export type ScriptLogType = 'out' | 'err';

export interface ScriptLogRecord {
  type: ScriptLogType;
  content: string;
  recordAt: number;
}

export interface ScriptLogDocument {
  _id: ObjectId;
  script: string;
  records: ScriptLogRecord[];
  createdAt: number;
}

export interface ScriptLogClientDocument {
  id: string;
  records: ScriptLogRecord[];
  createdAt: number;
}

export class ScriptLogService {
  get collection(): Collection<ScriptLogDocument> {
    return this.dbService.collection<ScriptLogDocument>('script-logs');
  }

  constructor(private dbService: DBService) {}

  async get(id: string): Promise<ScriptLogClientDocument | undefined> {
    let document = await this.collection.findOne({_id: new ObjectId(id)});

    return document ? coverScriptLogDocument(document) : undefined;
  }

  async list(
    script: string,
    start: number,
    size: number,
  ): Promise<ScriptLogClientDocument[]> {
    return this.collection
      .find({script})
      .sort({
        createdAt: 'desc',
      })
      .skip(start)
      .limit(size)
      .map(coverScriptLogDocument)
      .toArray();
  }

  async query(id: string): Promise<ScriptLogDocument | undefined> {
    let document = await this.collection.findOne({_id: new ObjectId(id)});

    return document || undefined;
  }

  async create(
    document: Omit<ScriptLogDocument, '_id'>,
  ): Promise<ScriptLogClientDocument> {
    let {insertedId} = await this.collection.insertOne(
      document as unknown as ScriptLogDocument,
    );

    return coverScriptLogDocument({...document, _id: insertedId});
  }

  async getLoggers(
    script: string,
  ): Promise<[out: ScriptLogger, err: ScriptLogger]> {
    let {id} = await this.create({
      script,
      records: [],
      createdAt: Date.now(),
    });

    return [
      new ScriptLogger(this, id, 'out'),
      new ScriptLogger(this, id, 'err'),
    ];
  }

  async appendRecord(id: string, record: ScriptLogRecord): Promise<boolean> {
    let {matchedCount} = await this.collection.updateOne(
      {_id: new ObjectId(id)},
      {
        $push: {
          records: record,
        },
      },
    );

    return !!matchedCount;
  }

  async update(
    id: string,
    document: Partial<ScriptLogDocument>,
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
}

function coverScriptLogDocument({
  _id,
  records,
  createdAt,
}: ScriptLogDocument): ScriptLogClientDocument {
  return {
    id: _id.toHexString(),
    records,
    createdAt,
  };
}

export class ScriptLogger extends Stream.Writable {
  private chunks: Buffer[] = [];

  constructor(
    private scriptLogService: ScriptLogService,
    readonly logId: string,
    readonly type: ScriptLogType,
  ) {
    super({
      write: (chunk, _encoding, callback) => {
        this.chunks.push(chunk);
        this.record(chunk.toString('utf-8')).finally(callback);
      },
    });
  }

  async record(content: string): Promise<boolean> {
    return this.scriptLogService.appendRecord(this.logId, {
      type: this.type,
      content,
      recordAt: Date.now(),
    });
  }

  async end(): Promise<string> {
    super.end();

    return new Promise(resolve => {
      this.once('finish', () => {
        resolve(Buffer.concat(this.chunks).toString('utf-8').trim());
      });
    });
  }
}
