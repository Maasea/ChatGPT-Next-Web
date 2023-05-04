import { QueryObject, User } from "@/app/db/typing";
import { DBNAME, MongoDB, MONGODB_URI } from "@/app/db/mongodb";

const COLLECTION_USER = process.env.USER ?? "user";
const mongoDb = new MongoDB(MONGODB_URI, DBNAME);
export async function insertUser(
  name: string,
  token: String,
  remark?: string,
): Promise<string> {
  try {
    const res = await mongoDb.insert(COLLECTION_USER, {
      name: name,
      accessToken: token,
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
  token?: string | null,
): Promise<Array<User>> {
  try {
    let query: QueryObject = {};

    if (name) {
      query.name = name;
    }
    if (token) {
      query.accessToken = token;
    }

    return await mongoDb.query<User>(COLLECTION_USER, query, {
      projection: { _id: 0, accessToken: 0 },
    });
  } catch (error) {
    console.error("[Query User]", error);
    throw error;
  }
}

export async function updateUser(
  token: string,
  update: QueryObject,
): Promise<boolean> {
  try {
    return await mongoDb.update(
      COLLECTION_USER,
      { accessToken: token },
      update,
    );
  } catch (error) {
    console.error("[Update User]", error);
    throw error;
  }
}

export async function deleteUser(token: string): Promise<boolean> {
  try {
    return await mongoDb.delete(COLLECTION_USER, { accessToken: token });
  } catch (error) {
    console.error("[Delete User]", error);
    throw error;
  }
}
