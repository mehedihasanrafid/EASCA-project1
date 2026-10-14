import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { VariantCombinationsTable } from "../components/VariantCombinationsTable/VariantCombinationsTable";
import type { VariantOptionsController } from "../hooks/useProductCatalogOptions";
import { createEmptyVariant } from "../utils/productEditor.mappers";

describe("VariantCombinationsTable", () => {
  it("lists SKUs with bulk, CSV, default, edit, and remove operations", () => {
    const variant = { ...createEmptyVariant(), sku: "SHIRT-BLACK-XL", optionLabel: "Black / XL", price: "899" };
    const builder = {
      variants: [variant],
      assignments: [],
      selectedRows: [],
      focusedVariantKey: variant.key,
      bulkOpen: false,
      bulkField: "price",
      bulkValue: "",
      csvInputRef: { current: null },
      setBulkOpen: vi.fn(),
      setBulkField: vi.fn(),
      setBulkValue: vi.fn(),
      onImportCsv: vi.fn(),
      onExportCsv: vi.fn(),
      toggleAllRows: vi.fn(),
      toggleRow: vi.fn(),
      setFocusedVariantKey: vi.fn(),
      valueForAssignment: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      applyBulkValue: vi.fn(),
    } as unknown as VariantOptionsController;

    const html = renderToStaticMarkup(<VariantCombinationsTable builder={builder} />);
    expect(html).toContain("All Variant Combinations (1)");
    expect(html).toContain("SHIRT-BLACK-XL");
    expect(html).toContain("Import CSV");
    expect(html).toContain("Export CSV");
  });
});

