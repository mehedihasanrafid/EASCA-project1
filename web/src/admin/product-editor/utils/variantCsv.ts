/**
 * CSV interchange helpers for the product variant workbench.
 *
 * This module deliberately does not import the editor's VariantDraft type. The
 * editor can map its current (or future) draft shape to VariantCsvSource and
 * apply the returned VariantCsvPatch records without coupling CSV support to a
 * specific UI component.
 */

export type VariantCsvValue = string | number | null | undefined;

export interface VariantCsvSource {
  sku: string;
  barcode?: VariantCsvValue;
  optionLabel?: VariantCsvValue;
  optionValueIds?: readonly string[] | string | null;
  price?: VariantCsvValue;
  discountPrice?: VariantCsvValue;
  costPrice?: VariantCsvValue;
  stockQuantity?: VariantCsvValue;
  lowStockLevel?: VariantCsvValue;
  isActive?: boolean | null;
  isDefault?: boolean | null;
}

/**
 * Numeric values stay as validated strings so they can be assigned directly to
 * controlled form inputs without losing decimal precision or formatting.
 * Missing numeric/boolean cells are omitted from the patch.
 */
export interface VariantCsvPatch {
  sku: string;
  barcode?: string;
  optionLabel?: string;
  optionValueIds?: string[];
  price?: string;
  discountPrice?: string;
  costPrice?: string;
  stockQuantity?: string;
  lowStockLevel?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface VariantCsvError {
  /** One-based logical CSV row number; the header is row 1. */
  row: number;
  field?: keyof VariantCsvPatch | "csv";
  message: string;
  value?: string;
}

export interface VariantCsvParseResult {
  records: VariantCsvPatch[];
  errors: VariantCsvError[];
}

type ColumnKey = keyof VariantCsvPatch;
type DecimalPatchField =
  | "price"
  | "discountPrice"
  | "costPrice";
type IntegerPatchField = "stockQuantity" | "lowStockLevel";
type BooleanPatchField = "isActive" | "isDefault";

interface CsvColumn {
  key: ColumnKey;
  header: string;
  aliases?: readonly string[];
}

export const VARIANT_CSV_COLUMNS: readonly CsvColumn[] = [
  { key: "sku", header: "sku" },
  { key: "barcode", header: "barcode", aliases: ["gtin", "barcode_gtin"] },
  { key: "optionLabel", header: "option_label", aliases: ["variant", "variant_name", "option"] },
  { key: "optionValueIds", header: "option_value_ids", aliases: ["value_ids", "option_ids"] },
  { key: "price", header: "price", aliases: ["selling_price", "regular_price"] },
  { key: "discountPrice", header: "discount_price", aliases: ["discount", "sale_price"] },
  { key: "costPrice", header: "cost_price", aliases: ["cost"] },
  { key: "stockQuantity", header: "stock_quantity", aliases: ["stock", "quantity"] },
  { key: "lowStockLevel", header: "low_stock_level", aliases: ["low_stock", "low_stock_warning"] },
  { key: "isActive", header: "active", aliases: ["is_active", "status"] },
  { key: "isDefault", header: "default", aliases: ["is_default", "default_selection"] },
] as const;

const DECIMAL_FIELDS = new Set<DecimalPatchField>([
  "price",
  "discountPrice",
  "costPrice",
]);

const INTEGER_FIELDS = new Set<IntegerPatchField>(["stockQuantity", "lowStockLevel"]);
const BOOLEAN_FIELDS = new Set<BooleanPatchField>(["isActive", "isDefault"]);

const isDecimalField = (key: ColumnKey): key is DecimalPatchField =>
  DECIMAL_FIELDS.has(key as DecimalPatchField);
const isIntegerField = (key: ColumnKey): key is IntegerPatchField =>
  INTEGER_FIELDS.has(key as IntegerPatchField);
const isBooleanField = (key: ColumnKey): key is BooleanPatchField =>
  BOOLEAN_FIELDS.has(key as BooleanPatchField);

const normalizeHeader = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const columnByHeader = new Map<string, CsvColumn>(
  VARIANT_CSV_COLUMNS.flatMap((column) =>
    [column.header, ...(column.aliases ?? [])].map(
      (header) => [normalizeHeader(header), column] as const,
    ),
  ),
);

const escapeCsvCell = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const sourceValue = (variant: VariantCsvSource, key: ColumnKey): string => {
  if (key === "optionValueIds") {
    const ids = variant.optionValueIds;
    if (Array.isArray(ids)) return ids.join("|");
    return ids == null ? "" : String(ids);
  }
  if (key === "isActive" || key === "isDefault") {
    const value = variant[key];
    return value == null ? "" : value ? "true" : "false";
  }
  const value = variant[key];
  return value == null ? "" : String(value);
};

/** Serializes variant-like records using a stable, machine-readable header. */
export const exportVariantsToCsv = (variants: readonly VariantCsvSource[]): string => {
  const header = VARIANT_CSV_COLUMNS.map((column) => column.header).join(",");
  const rows = variants.map((variant) =>
    VARIANT_CSV_COLUMNS.map((column) =>
      escapeCsvCell(sourceValue(variant, column.key)),
    ).join(","),
  );
  return [header, ...rows].join("\r\n");
};

interface ParsedCsv {
  rows: string[][];
  error?: string;
}

/** Parses RFC-4180-style commas, escaped quotes, and quoted line breaks. */
const parseCsvRows = (csv: string): ParsedCsv => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let quoteClosed = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
    quoteClosed = false;
  };
  const pushRow = () => {
    pushCell();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else if (character === "\r") {
        if (csv[index + 1] === "\n") index += 1;
        cell += "\n";
      } else {
        cell += character;
      }
      continue;
    }

    if (quoteClosed) {
      if (character === ",") {
        pushCell();
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && csv[index + 1] === "\n") index += 1;
        pushRow();
      } else if (character !== " " && character !== "\t") {
        return { rows: [], error: "Unexpected character after a closing quote." };
      }
      continue;
    }

    if (character === '"') {
      if (cell.length > 0) {
        return { rows: [], error: "A quoted field must begin with a quote." };
      }
      inQuotes = true;
    } else if (character === ",") {
      pushCell();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      cell += character;
    }
  }

  if (inQuotes) return { rows: [], error: "The CSV ends inside a quoted field." };
  if (cell.length > 0 || row.length > 0 || quoteClosed) pushRow();

  return { rows };
};

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1", "active"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "inactive"].includes(normalized)) return false;
  return undefined;
};

const parseOptionValueIds = (value: string): string[] | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
        return undefined;
      }
      return [...new Set(parsed.map((item) => item.trim()).filter(Boolean))];
    } catch {
      return undefined;
    }
  }

  return [...new Set(trimmed.split(/[|;]/).map((item) => item.trim()).filter(Boolean))];
};

const isBlankRow = (row: readonly string[]) => row.every((value) => value.trim() === "");

/**
 * Parses CSV into validated patches. Invalid rows are excluded from `records`
 * and described in `errors`, allowing the UI to show all problems at once.
 */
export const parseVariantCsv = (csv: string): VariantCsvParseResult => {
  const parsed = parseCsvRows(csv);
  if (parsed.error) {
    return { records: [], errors: [{ row: 1, field: "csv", message: parsed.error }] };
  }

  const nonEmptyRows = parsed.rows.filter((row) => !isBlankRow(row));
  if (nonEmptyRows.length === 0) {
    return { records: [], errors: [{ row: 1, field: "csv", message: "The CSV file is empty." }] };
  }

  const [headerRow, ...dataRows] = nonEmptyRows;
  const columns = headerRow.map((header) => columnByHeader.get(normalizeHeader(header)));
  const errors: VariantCsvError[] = [];
  const seenColumns = new Set<ColumnKey>();

  columns.forEach((column, index) => {
    if (!column) return;
    if (seenColumns.has(column.key)) {
      errors.push({
        row: 1,
        field: column.key,
        value: headerRow[index],
        message: `The ${column.header} column appears more than once.`,
      });
    }
    seenColumns.add(column.key);
  });

  if (!seenColumns.has("sku")) {
    errors.push({ row: 1, field: "sku", message: "A sku column is required." });
  }
  if (errors.length > 0) return { records: [], errors };

  const records: VariantCsvPatch[] = [];
  const seenSkus = new Set<string>();

  dataRows.forEach((row, dataIndex) => {
    const rowNumber = dataIndex + 2;
    const rowErrors: VariantCsvError[] = [];
    const patch: VariantCsvPatch = { sku: "" };

    if (row.length > headerRow.length) {
      rowErrors.push({
        row: rowNumber,
        field: "csv",
        message: "This row contains more values than the header.",
      });
    }

    columns.forEach((column, columnIndex) => {
      if (!column) return;
      const rawValue = row[columnIndex] ?? "";
      const value = rawValue.trim();

      if (column.key === "sku") {
        patch.sku = value.toUpperCase();
        if (!patch.sku) {
          rowErrors.push({ row: rowNumber, field: "sku", message: "SKU is required." });
        }
        return;
      }

      if (column.key === "barcode" || column.key === "optionLabel") {
        patch[column.key] = value;
        return;
      }

      if (column.key === "optionValueIds") {
        const ids = parseOptionValueIds(rawValue);
        if (!ids) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: "Option value IDs must use | or ; separators, or a JSON string array.",
          });
        } else {
          patch.optionValueIds = ids;
        }
        return;
      }

      if (isDecimalField(column.key) || isIntegerField(column.key)) {
        if (!value) return;
        const numberValue = Number(value);
        const requiresInteger = isIntegerField(column.key);
        if (!Number.isFinite(numberValue) || numberValue < 0 || (requiresInteger && !Number.isInteger(numberValue))) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: requiresInteger
              ? "Enter a non-negative whole number."
              : "Enter a non-negative number.",
          });
        } else {
          patch[column.key] = value;
        }
        return;
      }

      if (isBooleanField(column.key)) {
        if (!value) return;
        const booleanValue = parseBoolean(value);
        if (booleanValue === undefined) {
          rowErrors.push({
            row: rowNumber,
            field: column.key,
            value: rawValue,
            message: "Use true/false, yes/no, 1/0, or active/inactive.",
          });
        } else {
          patch[column.key] = booleanValue;
        }
      }
    });

    if (patch.sku) {
      if (seenSkus.has(patch.sku)) {
        rowErrors.push({
          row: rowNumber,
          field: "sku",
          value: patch.sku,
          message: "SKU appears more than once in this CSV file.",
        });
      } else {
        seenSkus.add(patch.sku);
      }
    }

    if (rowErrors.length > 0) errors.push(...rowErrors);
    else records.push(patch);
  });

  return { records, errors };
};
