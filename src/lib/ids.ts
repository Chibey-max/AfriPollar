import { randomUUID } from "crypto";

export function id(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 18)}`;
}

export function transferReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = randomUUID().slice(0, 4).toUpperCase();
  return `AFRI-${stamp}-${suffix}`;
}

