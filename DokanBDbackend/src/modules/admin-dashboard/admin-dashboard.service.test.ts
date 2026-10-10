import { describe, expect, it } from "vitest";

import { fillDailySales } from "./admin-dashboard.service.js";

describe("admin dashboard sales series", () => {
  it("fills missing dates with zero sales and orders", () => {
    expect(
      fillDailySales(
        [{ date: "2026-10-09", sales: "1250.50", orderCount: "2" }],
        new Date(2026, 9, 10, 12),
        3,
      ),
    ).toEqual([
      { date: "2026-10-08", sales: "0.00", orderCount: 0 },
      { date: "2026-10-09", sales: "1250.50", orderCount: 2 },
      { date: "2026-10-10", sales: "0.00", orderCount: 0 },
    ]);
  });

  it("always formats sales as two-decimal money strings", () => {
    expect(
      fillDailySales(
        [{ date: "2026-10-10", sales: "90", orderCount: "1" }],
        new Date(2026, 9, 10, 12),
        1,
      ),
    ).toEqual([{ date: "2026-10-10", sales: "90.00", orderCount: 1 }]);
  });
});
