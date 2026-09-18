import { AGENTS } from "@/data/corridor-config";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export function GET() {
  return ok(AGENTS);
}

