import { NextRequest } from "next/server";
import { insertUser, queryUser, updateUser } from "@/app/db/user-client";
import { QueryObject } from "@/app/db/typing";
import { createErrorResponse, createSuccessResponse } from "@/app/api/common";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, token, remark } = body;
    const user = await queryUser(name, token);

    if (user.length) {
      return createErrorResponse("user already exists", 400);
    }

    const insertId = await insertUser(name, token, remark);
    return createSuccessResponse({ insertId: insertId });
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const name = params.get("name");
    const token = params.get("token");

    if (name || token) {
      const res = await queryUser(name, token);
      return createSuccessResponse(res);
    } else {
      return createErrorResponse("missing params name and token", 400);
    }
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { token, name, remark } = await req.json();
    if (token && (name || remark)) {
      let update: QueryObject = { name: name };
      if (remark) update.remark = remark;
      await updateUser(token, update);
      return createSuccessResponse();
    } else {
      return createErrorResponse(
        `missing params ${token ? "name or remark" : "token"} `,
        400,
      );
    }
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}
