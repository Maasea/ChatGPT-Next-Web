import { QueryObject, User } from "@/app/db/typing";
import { DBNAME, MongoDB, MONGODB_URI } from "@/app/db/mongodb";

const COLLECTION_USER = process.env.USER ?? "user";
const mongoDb = new MongoDB(MONGODB_URI, DBNAME);

export async function insertUser(
  name: string,
  accessCode: String,
  remark?: string,
): Promise<string> {
  try {
    const res = await mongoDb.insert(COLLECTION_USER, {
      name: name,
      accessCode: accessCode,
      remark: remark,
    });
    const insertedId = res.insertedId.toString();
    console.log("[Insert User]", insertedId);
    return insertedId;
  } catch (error) {
    console.error("[Insert User]", error);
    throw error;
  }
}

export async function queryUser(
  name?: string | null,
  accessCode?: string | null,
): Promise<Array<User>> {
  try {
    let query: QueryObject = {};

    if (name) {
      query.name = name;
    }
    if (accessCode) {
      query.accessCode = accessCode;
    }

    return await mongoDb.query<User>(COLLECTION_USER, query, {
      projection: { _id: 0, accessCode: 0 },
    });
  } catch (error) {
    console.error("[Query User]", error);
    throw error;
  }
}

export async function updateUser(
  accessCode: string,
  update: QueryObject,
): Promise<boolean> {
  try {
    return await mongoDb.update(
      COLLECTION_USER,
      { accessCode: accessCode },
      update,
    );
  } catch (error) {
    console.error("[Update User]", error);
    throw error;
  }
}

export async function deleteUser(accessCode: string): Promise<boolean> {
  try {
    return await mongoDb.delete(COLLECTION_USER, { accessCode: accessCode });
  } catch (error) {
    console.error("[Delete User]", error);
    throw error;
  }
}
