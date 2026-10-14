import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SelectedSkuEditor } from "../components/SelectedSkuEditor/SelectedSkuEditor";
import type { VariantOptionsController } from "../hooks/useProductCatalogOptions";
import { createEmptyVariant } from "../utils/productEditor.mappers";

describe("SelectedSkuEditor", () => {
  it("renders the focused SKU's commercial and inventory fields", () => {
    const variant = { ...createEmptyVariant(), sku: "SHIRT-BLACK-XL", optionLabel: "Black / XL" };
    const builder = {
      focusedVariant: variant,
      focusedPreviewMedia: undefined,
      focusedMediaLimitReached: false,
      variantMediaEnabled: true,
      focusedDiscountPercentage: "",
      focusedMedia: [],
      focusedPendingMedia: [],
      mediaBusyId: null,
      update: vi.fn(),
      onAddMedia: vi.fn(),
      onSetPrimaryMedia: vi.fn(),
      onDeleteMedia: vi.fn(),
    } as unknown as VariantOptionsController;

    const html = renderToStaticMarkup(<SelectedSkuEditor builder={builder} />);
    expect(html).toContain("Black / XL");
    expect(html).toContain("SHIRT-BLACK-XL");
    expect(html).toContain("Selling price");
    expect(html).toContain("Stock quantity");
  });
});

