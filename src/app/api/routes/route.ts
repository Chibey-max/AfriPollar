import { CORRIDOR_ROUTES } from "@/data/corridor-config";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export function GET() {
  return ok(CORRIDOR_ROUTES);
}

