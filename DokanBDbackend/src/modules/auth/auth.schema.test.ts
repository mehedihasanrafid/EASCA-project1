import { describe, expect, it } from "vitest";

import { demoLoginSchema } from "./auth.schema.js";

describe("demoLoginSchema", () => {
  it.each(["CUSTOMER", "ADMIN"])("accepts the %s demo role", (role) => {
    expect(demoLoginSchema.parse({ role })).toEqual({ role });
  });

  it.each(["OWNER", "customer", "", undefined])(
    "rejects unsupported demo role %s",
    (role) => {
      expect(() => demoLoginSchema.parse({ role })).toThrow();
    },
  );
});
