
import { describe, expect, it } from "vitest";
import { isCustomerRole, isStaffRole } from "./roles";

describe("shared role utilities", () => {
  it("recognizes admin and owner as staff", () => {
    expect(isStaffRole("ADMIN")).toBe(true);
    expect(isStaffRole("OWNER")).toBe(true);
  });

  it("does not treat customers as staff", () => {
    expect(isStaffRole("CUSTOMER")).toBe(false);
  });

  it("recognizes customer accounts", () => {
    expect(isCustomerRole("CUSTOMER")).toBe(true);
    expect(isCustomerRole("ADMIN")).toBe(false);
    expect(isCustomerRole("OWNER")).toBe(false);
  });

  it("handles missing or unknown roles safely", () => {
    expect(isStaffRole(null)).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
    expect(isStaffRole("UNKNOWN")).toBe(false);

    expect(isCustomerRole(null)).toBe(false);
    expect(isCustomerRole(undefined)).toBe(false);
    expect(isCustomerRole("UNKNOWN")).toBe(false);
  });
});
