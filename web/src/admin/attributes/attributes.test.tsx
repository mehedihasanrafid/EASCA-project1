import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AdminAttribute } from "../../api/adminCatalog";
import { parseAttributeValues } from "./attribute-values";
import { AttributeForm } from "./components/AttributeForm";
import { AttributesTable } from "./components/AttributesTable";

const sizeAttribute: AdminAttribute = {
  id: "attribute-size",
  name: "Size",
  code: "size",
  inputType: "SELECT",
  isActive: true,
  deletedAt: null,
  values: [
    { id: "small", attributeId: "attribute-size", label: "S", code: "s", colorHex: null, sortOrder: 0, isActive: true, deletedAt: null },
    { id: "medium", attributeId: "attribute-size", label: "M", code: "m", colorHex: null, sortOrder: 1, isActive: true, deletedAt: null },
  ],
};

describe("product attributes", () => {
  it("normalizes comma-separated values and removes duplicates", () => {
    expect(parseAttributeValues(" S, M, s, XL,  ")).toEqual(["S", "M", "XL"]);
  });

  it("renders the simple two-field form", () => {
    const html = renderToStaticMarkup(<AttributeForm busy={false} onSubmit={vi.fn()} />);

    expect(html).toContain("Property name");
    expect(html).toContain("Values");
    expect(html).toContain("Separate values with commas.");
    expect(html).toContain("Add property");
  });

  it("renders attributes and their values in a table", () => {
    const html = renderToStaticMarkup(
      <AttributesTable
        attributes={[sizeAttribute]}
        busy={false}
        loading={false}
        onAddValue={vi.fn()}
        onDelete={vi.fn()}
        onDeleteValue={vi.fn()}
        onEdit={vi.fn()}
        onRestore={vi.fn()}
        onRestoreValue={vi.fn()}
      />,
    );

    expect(html).toContain("Attribute name");
    expect(html).toContain("Size");
    expect(html).toContain("S");
    expect(html).toContain("M");
    expect(html).toContain("Add value to Size");
    expect(html).toContain("Remove S");
    expect(html).toContain("Edit Size");
    expect(html).toContain("Active");
  });
});
