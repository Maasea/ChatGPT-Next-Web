import { NextRequest } from "next/server";
import { insertUsage, queryUsage } from "@/app/db/usage-client";
import { createErrorResponse, createSuccessResponse } from "@/app/api/common";
import { auth, parseApiKey } from "@/app/api/auth";

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, completion } = await req.json();
    const authToken = req.headers.get("Authorization") ?? "";
    const { accessCode, apiKey } = parseApiKey(authToken);
    const insertId = await insertUsage(
      model,
      prompt,
      completion,
      accessCode,
      apiKey,
    );
    return createSuccessResponse({ insertId: insertId });
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const start = params.get("startDate") as string;
    const end = params.get("endDate") as string;
    const isAll = params.get("all")?.toLowerCase() === "true";
    const result = auth(req);

    if (isAll && !result.isAdmin) {
      return createErrorResponse(result.msg, 403);
    }
    const accessCode = params.get("accessCode") ?? result.accessCode ?? "";
    if (isAll || accessCode) {
      const res = await queryUsage(accessCode, start, end, isAll);
      return createSuccessResponse(res);
    } else {
      return createErrorResponse("missing param accessCode", 400);
    }
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}
