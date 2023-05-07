import { NextRequest } from "next/server";
import { insertUser, queryUser, updateUser } from "@/app/db/user-client";
import { QueryObject } from "@/app/db/typing";
import { createErrorResponse, createSuccessResponse } from "@/app/api/common";
import { auth } from "@/app/api/auth";

export async function POST(req: NextRequest) {
  try {
    const result = auth(req);

    if (!result.isAdmin) {
      return createErrorResponse(result.msg, 403);
    }

    const body = await req.json();
    const { name, accessCode, remark } = body;
    const user = await queryUser(name, accessCode);

    if (user.length) {
      return createErrorResponse("user already exists", 400);
    }

    const insertId = await insertUser(name, accessCode, remark);
    return createSuccessResponse({ insertId: insertId });
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const name = params.get("name");
    const accessCode = params.get("accessCode");
    if (name || accessCode || auth(req).isAdmin) {
      const res = await queryUser(name, accessCode);
      return createSuccessResponse(res);
    } else {
      return createErrorResponse("missing params name or accessCode", 400);
    }
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const result = auth(req);

    if (!result.isAdmin) {
      return createErrorResponse(result.msg, 403);
    }

    const { accessCode, name, remark } = await req.json();
    if (accessCode && (name || remark)) {
      let update: QueryObject = { name: name };
      if (remark) update.remark = remark;
      await updateUser(accessCode, update);
      return createSuccessResponse();
    } else {
      return createErrorResponse(
        `missing params ${accessCode ? "name or remark" : "accessCode"} `,
        400,
      );
    }
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}
