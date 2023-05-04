import { NextRequest } from "next/server";
import { insertUsage, queryUsage } from "@/app/db/usage-client";
import { createErrorResponse, createSuccessResponse } from "@/app/api/common";

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, completion } = await req.json();
    const accessToken = req.headers.get("access-code");
    const apiKey = req.headers.get("token");
    const insertId = await insertUsage(
      model,
      prompt,
      completion,
      accessToken,
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
    const token = req.headers.get("access-token") ?? params.get("token");

    if (isAll || token) {
      const res = await queryUsage(token, start, end, isAll);
      return createSuccessResponse(res);
    } else {
      return createErrorResponse("missing param token", 400);
    }
  } catch (e) {
    return createErrorResponse(JSON.stringify(e), 500);
  }
}
