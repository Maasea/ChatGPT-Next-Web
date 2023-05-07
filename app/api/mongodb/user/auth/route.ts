import { NextRequest } from "next/server";
import { auth } from "@/app/api/auth";
import { createErrorResponse, createSuccessResponse } from "@/app/api/common";

export function GET(req: NextRequest) {
  try {
    const res = auth(req);
    return createSuccessResponse({ isAdmin: res.isAdmin });
  } catch (e) {
    return createErrorResponse("e", 500);
  }
}

export function POST(req: NextRequest) {
  return GET(req);
}
