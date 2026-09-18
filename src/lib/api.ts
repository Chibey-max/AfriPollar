import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/types/corridor";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      details,
    },
  };

  return NextResponse.json(body, { status });
}

export async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

