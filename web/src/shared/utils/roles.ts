
/**
 * Shared frontend role checks.
 * These control UI visibility and navigation only.
 * Backend authorization must still enforce permissions.
 */

/** ADMIN and OWNER are both staff members. */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "OWNER";
}

/** Check specifically for the CUSTOMER role. */
export function isCustomerRole(role: string | null | undefined): boolean {
  return role === "CUSTOMER";
}
