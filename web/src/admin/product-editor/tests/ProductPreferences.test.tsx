import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProductPreferences } from "../components/ProductPreferences/ProductPreferences";
import type { ProductEditorController } from "../hooks/useProductEditor";
import { createEmptyVariant, emptyProductForm } from "../utils/productEditor.mappers";

/** Keep the test fixture small: it models only controller values used by this panel. */
const mockEditor = (overrides: Record<string, unknown> = {}) => ({
  form: emptyProductForm,
  variantDrafts: [createEmptyVariant()],
  priceTiers: [],
  setPriceTiers: vi.fn(),
  priceTierScope: "all",
  bulkPricingMode: "off",
  discountScope: "all",
  discountMode: "off",
  mediaScope: "all",
  media: [],
  pendingMedia: [],
  mediaBusyId: null,
  mediaCountForScope: vi.fn().mockReturnValue(0),
  handleImageSelection: vi.fn(),
  changeBulkPricingMode: vi.fn(),
  changeDiscountMode: vi.fn(),
  changeMediaScope: vi.fn(),
  globalDiscountPercentage: "",
  settingsRegularPrice: "",
  editingProductId: null,
  setField: vi.fn(),
  ...overrides,
}) as unknown as ProductEditorController;

describe("ProductPreferences", () => {
  it("starts a new product with discount Off and empty discount controls", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor()} />);

    expect(html).toContain("Offer discount");
    expect(html).toContain("Not enabled");
    expect(html).not.toMatch(/aria-label="Offer discount: All SKUs"[^>]*checked/);
    expect(html).not.toMatch(/aria-label="Offer discount: Individual SKU"[^>]*checked/);
    expect(html).not.toContain("Discount % off");
  });

  it("has a clean heading, three rows, and mandatory shared media", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor()} />);
    expect(html).toContain("Product Preferences");
    expect(html).not.toContain("Choose the features to enable");
    expect(html).toContain("Bulk pricing");
    expect(html).toContain("Offer discount");
    expect(html).toContain("Product media");
    expect(html).toContain("Shared");
    expect(html).toContain("Add shared media");
  });

  it("shows the shared bulk price count when offers exist", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor({
      bulkPricingMode: "all",
      priceTiers: [{ key: "tier-1", variantKey: "all", minimumQuantity: "3", unitPrice: "95", isPromotion: false, isActive: true }],
    })} />);
    expect(html).toContain("1 bulk price offer");
    expect(html).toContain("Set quantity price blocks");
  });

  it("requires one image per active SKU when individual media is selected", () => {
    const html = renderToStaticMarkup(<ProductPreferences editor={mockEditor({ mediaScope: "individual" })} />);
    expect(html).toContain("1 per SKU");
    expect(html).toContain("SKU images ready: 0 / 1");
  });
});
