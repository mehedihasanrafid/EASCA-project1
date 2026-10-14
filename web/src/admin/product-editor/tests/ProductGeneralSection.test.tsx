import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProductGeneralSection } from "../components/ProductGeneralSection/ProductGeneralSection";
import type { ProductEditorController } from "../hooks/useProductEditor";
import { emptyProductForm } from "../utils/productEditor.mappers";

describe("ProductGeneralSection", () => {
  it("shows only product identity and catalog relationships", () => {
    const editor = {
      form: { ...emptyProductForm, categoryId: "category-1", productTypeId: "type-1" },
      categories: [{ id: "category-1", name: "Clothing", displayName: "Clothing", children: [], allowProducts: true }],
      brands: [{ id: "brand-1", name: "DokanBD", isActive: true, deletedAt: null }],
      productTypes: [{ id: "type-1", name: "T-shirt", isActive: true, deletedAt: null }],
      allowedProductTypeIds: ["type-1"],
      editingProductId: null,
      originalVariantIds: [],
      setField: vi.fn(),
      setForm: vi.fn(),
    } as unknown as ProductEditorController;

    const html = renderToStaticMarkup(
      <MemoryRouter><ProductGeneralSection editor={editor} /></MemoryRouter>,
    );
    expect(html).toContain("Product name");
    expect(html).toContain("Clothing");
    expect(html).toContain("T-shirt");
    expect(html).toContain("DokanBD");
  });
});

