import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { AdminAttribute } from "../../../api/adminCatalog";
import { ProductTypeAttributeEditor } from "./ProductTypeAttributeEditor";

const attributes: AdminAttribute[] = [
  {
    id: "color",
    name: "Color",
    code: "color",
    inputType: "SELECT",
    isActive: true,
    deletedAt: null,
    values: [
      { id: "black", attributeId: "color", label: "Black", code: "black", colorHex: null, sortOrder: 0, isActive: true, deletedAt: null },
    ],
  },
  {
    id: "size",
    name: "Size",
    code: "size",
    inputType: "SELECT",
    isActive: true,
    deletedAt: null,
    values: [],
  },
];

describe("ProductTypeAttributeEditor", () => {
  it("shows assignment order, requirement and remaining attributes", () => {
    const html = renderToStaticMarkup(
      <ProductTypeAttributeEditor
        attributes={attributes}
        selections={[{ attributeId: "color", isRequired: true, sortOrder: 0 }]}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain("Assigned attributes");
    expect(html).toContain("Color");
    expect(html).toContain("Black");
    expect(html).toContain("Required for every SKU");
    expect(html).toContain("Add Size");
    expect(html).toContain("making it required when existing SKUs have no value will be blocked safely");
  });

  it("explains that a type without attributes uses a simple variant", () => {
    const html = renderToStaticMarkup(
      <ProductTypeAttributeEditor attributes={attributes} selections={[]} onChange={vi.fn()} />,
    );

    expect(html).toContain("No attributes assigned");
    expect(html).toContain("one simple stock variant");
  });
});
