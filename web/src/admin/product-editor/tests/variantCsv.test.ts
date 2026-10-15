import { describe, expect, it } from "vitest";

import { exportVariantsToCsv, parseVariantCsv } from "../utils/variantCsv";

describe("variant CSV interchange", () => {
  it("exports stable columns and escapes commas, quotes, and newlines", () => {
    const csv = exportVariantsToCsv([{
      sku: "shirt-green-xl",
      barcode: '123,"456"',
      optionLabel: "Green, XL\nLimited Edition",
      optionValueIds: ["color-green", "size-xl"],
      price: "899.00",
      discountPrice: 799,
      costPrice: 500,
      stockQuantity: 30,
      lowStockLevel: 5,
      isActive: true,
      isDefault: false,
    }]);

    expect(csv.split("\r\n")[0]).toBe(
      "sku,barcode,option_label,option_value_ids,price,discount_price,cost_price,stock_quantity,low_stock_level,active,default",
    );
    expect(csv).toContain('"123,""456"""');
    expect(csv).toContain('"Green, XL\nLimited Edition"');
    expect(csv).toContain("color-green|size-xl");
    expect(csv).toContain(",true,false");
  });

  it("round-trips every supported field without importing the editor draft type", () => {
    const csv = exportVariantsToCsv([{
      sku: "TSHIRT-GRN-XXL-MESH",
      barcode: "8901234567890",
      optionLabel: "Green / XXL / Mesh",
      optionValueIds: ["11", "22", "33"],
      price: "899.50",
      discountPrice: "799",
      costPrice: "500",
      stockQuantity: "30",
      lowStockLevel: "4",
      isActive: true,
      isDefault: true,
    }]);

    expect(parseVariantCsv(csv)).toEqual({
      errors: [],
      records: [{
        sku: "TSHIRT-GRN-XXL-MESH",
        barcode: "8901234567890",
        optionLabel: "Green / XXL / Mesh",
        optionValueIds: ["11", "22", "33"],
        price: "899.50",
        discountPrice: "799",
        costPrice: "500",
        stockQuantity: "30",
        lowStockLevel: "4",
        isActive: true,
        isDefault: true,
      }],
    });
  });

  it("parses BOM, friendly headers, quoted line breaks, escaped quotes, and boolean aliases", () => {
    const csv = [
      '\uFEFFSKU,Barcode / GTIN,Variant Name,Option IDs,Selling Price,Stock,Active,Default Selection',
      'abc-1,,"Blue, XL\nSpecial ""Drop""","[""blue"",""xl""]",749.95,8,active,yes',
      "abc-2,,Plain,blue;large,500,0,0,no",
    ].join("\r\n");

    expect(parseVariantCsv(csv)).toEqual({
      errors: [],
      records: [
        {
          sku: "ABC-1",
          barcode: "",
          optionLabel: 'Blue, XL\nSpecial "Drop"',
          optionValueIds: ["blue", "xl"],
          price: "749.95",
          stockQuantity: "8",
          isActive: true,
          isDefault: true,
        },
        {
          sku: "ABC-2",
          barcode: "",
          optionLabel: "Plain",
          optionValueIds: ["blue", "large"],
          price: "500",
          stockQuantity: "0",
          isActive: false,
          isDefault: false,
        },
      ],
    });
  });

  it("keeps valid rows and reports unsafe numeric, boolean, duplicate, and missing SKU rows", () => {
    const csv = [
      "sku,price,stock_quantity,low_stock_level,active,default",
      "GOOD-1,100.25,5,2,true,false",
      "BAD-NUMBER,-4,1,2,true,false",
      "BAD-INTEGER,100,1.5,2,true,false",
      "BAD-BOOLEAN,100,1,2,maybe,false",
      "GOOD-1,100,1,2,true,false",
      ",100,1,2,true,false",
    ].join("\n");

    const result = parseVariantCsv(csv);

    expect(result.records).toEqual([{
      sku: "GOOD-1",
      price: "100.25",
      stockQuantity: "5",
      lowStockLevel: "2",
      isActive: true,
      isDefault: false,
    }]);
    expect(result.errors.map((error) => [error.row, error.field])).toEqual([
      [3, "price"],
      [4, "stockQuantity"],
      [5, "isActive"],
      [6, "sku"],
      [7, "sku"],
    ]);
  });

  it("rejects malformed CSV and missing or duplicate required headers", () => {
    expect(parseVariantCsv('sku,price\n"OPEN,10')).toEqual({
      records: [],
      errors: [{ row: 1, field: "csv", message: "The CSV ends inside a quoted field." }],
    });

    expect(parseVariantCsv("price,active\n10,true").errors[0]).toMatchObject({
      row: 1,
      field: "sku",
    });

    expect(parseVariantCsv("sku,SKU,price\nA,A,10").errors[0]).toMatchObject({
      row: 1,
      field: "sku",
    });
  });
});
