import { DBNAME, MongoDB, MONGODB_URI } from "@/app/db/mongodb";
import { QueryObject, Usage } from "@/app/db/typing";

const COLLECTION_USAGE = process.env.USAGE ?? "usage";
const mongoDb = new MongoDB(MONGODB_URI, DBNAME);

const PRICE_MAP = [
  {
    name: "gpt-4",
    prompt: 0.03,
    completion: 0.06,
  },
  {
    name: "gpt-4-0314",
    prompt: 0.03,
    completion: 0.06,
  },
  {
    name: "gpt-4-32k",
    prompt: 0.06,
    completion: 0.12,
  },
  {
    name: "gpt-4-32k-0314",
    prompt: 0.06,
    completion: 0.12,
  },
  {
    name: "gpt-3.5-turbo",
    prompt: 0.002,
    completion: 0.002,
  },
  {
    name: "gpt-3.5-turbo-0301",
    prompt: 0.002,
    completion: 0.002,
  },
];

export async function insertUsage(
  model: string,
  prompt: number,
  completion: number,
  accessCode: string | null,
  apiKey: string | null,
): Promise<string> {
  try {
    const priceObj = PRICE_MAP.find((client) => client.name === model)!;
    const price = (
      (prompt * priceObj.prompt + completion * priceObj.completion) /
      1000
    ).toFixed(6);

    const dataToInsert = {
      accessCode: accessCode ?? "",
      apiKey: apiKey ?? "",
      model: model,
      prompt: prompt,
      completion: completion,
      price: parseFloat(price),
    };

    console.log(dataToInsert);

    const res = await mongoDb.insert(COLLECTION_USAGE, dataToInsert);
    const insertId = res.insertedId.toString();

    console.log("[Insert Usage] " + insertId);
    return insertId;
  } catch (error) {
    console.error("[Insert Usage] ", error);
    throw error;
  }
}

export async function queryUsage(
  accessCode: Array<string> | string | null,
  startDate: string,
  endDate: string,
  isAll: boolean,
): Promise<Array<Usage>> {
  try {
    const query: QueryObject = {
      createDate: { $gte: new Date(startDate), $lt: new Date(endDate) },
    };

    if (!isAll) {
      query.accessCode = Array.isArray(accessCode)
        ? { $in: accessCode }
        : { $eq: accessCode };
    }

    return await mongoDb.query<Usage>(COLLECTION_USAGE, query, {
      projection: { _id: 0, apiKey: 0 },
    });
  } catch (error) {
    console.error("[QueryObject Usage] ", error);
    throw error;
  }
}
