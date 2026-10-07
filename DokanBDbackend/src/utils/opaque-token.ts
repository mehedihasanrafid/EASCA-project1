import { createHash, randomBytes } from "node:crypto";

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken() {
  return randomBytes(32).toString("hex");
}
