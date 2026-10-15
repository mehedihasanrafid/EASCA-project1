/**
 * Dedicated accounts used only by the optional one-click demo login.
 *
 * The frontend never receives a password. The seed creates these users with an
 * unknown random password, and the demo endpoint creates the session directly.
 * Keep these identifiers stable so re-running the seed updates the same users.
 */
export const demoAccounts = {
  CUSTOMER: {
    roleCode: "CUSTOMER",
    name: "DokanBD Demo Customer",
    email: "demo-customer@dokanbd.example",
    phone: "01900000002",
  },
  ADMIN: {
    roleCode: "ADMIN",
    name: "DokanBD Demo Admin",
    email: "demo-admin@dokanbd.example",
    phone: "01900000001",
  },
} as const;

export type DemoRole = keyof typeof demoAccounts;

export const demoRoles = Object.keys(demoAccounts) as DemoRole[];
