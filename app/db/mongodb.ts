import {
  MongoClient,
  ServerApiVersion,
  Db,
  Collection,
  InsertOneResult,
  FindOptions,
} from "mongodb";

export const MONGODB_URI = process.env.MONGODB ?? "";
export const DBNAME = process.env.DB ?? "gpt";

export class MongoDB {
  private static client: MongoClient;
  private db?: Db;

  constructor(private uri: string, private dbName: string) {
    if (!MongoDB.client) {
      MongoDB.client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
    }
  }

  public async connect(): Promise<void> {
    try {
      await MongoDB.client.connect();
      this.db = MongoDB.client.db(this.dbName);
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }

  public async collection(collectionName: string): Promise<Collection> {
    return this.db!.collection(collectionName);
  }

  public async close(): Promise<void> {}

  public async insert(
    collectionName: string,
    data: object,
  ): Promise<InsertOneResult<Document>> {
    try {
      await this.connect();
      // const currentDate = formatDate(new Date());
      return (await this.collection(collectionName))!.insertOne({
        ...data,
        createDate: new Date(),
      });
    } catch (error) {
      console.error("Error inserting data:", error);
      throw error;
    }
  }

  public async update(
    collectionName: string,
    filter: object,
    update: object,
  ): Promise<boolean> {
    try {
      await this.connect();
      await (await this.collection(collectionName))!.updateOne(filter, {
        $set: { ...update, updateDate: new Date() },
      });
      return true;
    } catch (error) {
      console.error("Error updating data:", error);
      throw error;
    }
  }

  public async query<T>(
    collectionName: string,
    filter: object,
    option?: FindOptions,
  ): Promise<Array<T>> {
    try {
      await this.connect();
      const result = await (await this.collection(collectionName))!
        .find(filter, option)
        .toArray();
      return result as T[];
    } catch (error) {
      console.error("Error querying data:", error);
      throw error;
    }
  }

  public async delete(
    collectionName: string,
    filter: object,
    option?: FindOptions,
  ): Promise<boolean> {
    try {
      await this.connect();
      await (await this.collection(collectionName)).deleteOne(filter, option);
      return true;
    } catch (error) {
      console.error("Error deleting data:", error);
      throw error;
    }
  }
}
