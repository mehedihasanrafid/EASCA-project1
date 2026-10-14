import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { ProductTypeAttributeAssignment } from "../../../api/adminCatalog";
import { ProductVariantPaths } from "../components/ProductVariantPaths/ProductVariantPaths";
import type { VariantOptionsController } from "../hooks/useProductCatalogOptions";
import { createEmptyVariant } from "../utils/productEditor.mappers";

const colorAssignment: ProductTypeAttributeAssignment = {
  attributeId: "color",
  isRequired: true,
  sortOrder: 0,
  attribute: {
    id: "color",
    name: "Color",
    code: "color",
    inputType: "SELECT",
    isActive: true,
    deletedAt: null,
    values: [
      { id: "black", attributeId: "color", label: "Black", code: "black", colorHex: "#111111", sortOrder: 0, isActive: true, deletedAt: null },
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `color-${index}`,
        attributeId: "color",
        label: `Color ${index + 1}`,
        code: `color-${index + 1}`,
        colorHex: null,
        sortOrder: index + 1,
        isActive: true,
        deletedAt: null,
      })),
    ],
  },
};

function builder(overrides: Partial<VariantOptionsController> = {}) {
  return {
    assignments: [colorAssignment],
    pathSelection: {},
    setPathSelection: vi.fn(),
    newValueLabels: {},
    setNewValueLabels: vi.fn(),
    addingValueFor: null,
    loading: false,
    currentPathLabels: [],
    pathIsComplete: false,
    exactPathCount: 0,
    variantPathTree: [],
    variants: [],
    focusedVariantKey: "",
    choosePathValue: vi.fn(),
    addSuggestedValue: vi.fn(),
    addExactVariantPath: vi.fn(),
    setFocusedVariantKey: vi.fn(),
    removePathBranch: vi.fn(),
    attributeCatalog: [colorAssignment.attribute],
    attributePickerOpen: false,
    setAttributePickerOpen: vi.fn(),
    addingAttribute: false,
    addProductAttribute: vi.fn(),
    createAndAddProductAttribute: vi.fn(),
    ...overrides,
  } as unknown as VariantOptionsController;
}

function render(controller: VariantOptionsController) {
  return renderToStaticMarkup(
    <MemoryRouter><ProductVariantPaths builder={controller} /></MemoryRouter>,
  );
}

describe("ProductVariantPaths", () => {
  it("renders searchable attribute steps and explains global value creation", () => {
    const html = render(builder());

    expect(html).toContain("Product-specific variant paths");
    expect(html).toContain("Search color");
    expect(html).toContain("Saved globally and reusable by other products.");
    expect(html).toContain("Complete each attribute level");
  });

  it("detects an existing exact path before another SKU is created", () => {
    const existing = {
      ...createEmptyVariant(),
      key: "existing-black",
      optionValueIds: ["black"],
      optionLabel: "Black",
      sku: "SHIRT-BLACK",
      stockQuantity: "2",
      id: "variant-1",
    };
    const html = render(builder({
      pathSelection: { color: "black" },
      currentPathLabels: ["Black"],
      pathIsComplete: true,
      exactPathCount: 1,
      variants: [existing],
      variantPathTree: [{
        valueId: "black",
        label: "Black",
        code: "black",
        colorHex: "#111111",
        attributeId: "color",
        attributeName: "Color",
        variantKeys: [existing.key],
        terminalVariantKeys: [existing.key],
        children: [],
      }],
    }));

    expect(html).toContain("Already exists as SHIRT-BLACK");
    expect(html).toContain("View existing SKU");
    expect(html).toContain("1 stocked");
  });

  it("points an empty Product Type to its assignment editor", () => {
    const html = render(builder({ assignments: [] }));

    expect(html).toContain("This Product Type has no assigned attributes.");
    expect(html).toContain("edit the Product Type template");
    expect(html).toContain("/admin/product-types");
  });

  it("shows existing attributes and a final New choice in the product picker", () => {
    const html = render(builder({ attributePickerOpen: true }));

    expect(html).toContain("Choose product attribute");
    expect(html).toContain("Available values");
    expect(html).toContain("Black, Color 1");
    expect(html).toContain("New");
    expect(html).toContain("Create a custom attribute for this product");
    expect(html).toContain("Parent relationship");
  });
});
