import { describe, expect, it } from "vitest";

import { collectDescendantCategoryIds } from "./product.service.js";

describe("public product category hierarchy", () => {
  const categories = [
    { id: "1", parentId: null },
    { id: "2", parentId: "1" },
    { id: "3", parentId: "2" },
    { id: "4", parentId: null },
  ];

  it("includes the selected category and every nested descendant", () => {
    expect(collectDescendantCategoryIds(categories, "1")).toEqual(["1", "2", "3"]);
  });

  it("does not include siblings or unrelated roots", () => {
    expect(collectDescendantCategoryIds(categories, "2")).toEqual(["2", "3"]);
    expect(collectDescendantCategoryIds(categories, "4")).toEqual(["4"]);
  });
});
