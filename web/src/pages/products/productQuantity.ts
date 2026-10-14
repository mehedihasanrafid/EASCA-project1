/** The input may be temporarily empty while the customer replaces its value. */
export type EditableProductQuantity = number | "";

const safeStockLimit = (stockQuantity: number) =>
  Math.max(1, Math.trunc(stockQuantity) || 1);

/**
 * Convert a number-input value without forcing an empty field back to 1.
 * Keeping "" during editing is what lets a customer replace 1 with 2, 3, etc.
 */
export function editableQuantityFromInput(
  value: string,
  stockQuantity: number,
): EditableProductQuantity {
  if (value.trim() === "") return "";

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";

  return Math.min(
    safeStockLimit(stockQuantity),
    Math.max(1, Math.trunc(parsed)),
  );
}

/** Resolve the temporary editing value before pricing or a cart request uses it. */
export function purchasableQuantity(
  quantity: EditableProductQuantity,
  stockQuantity: number,
) {
  if (quantity === "") return 1;
  return Math.min(safeStockLimit(stockQuantity), Math.max(1, Math.trunc(quantity)));
}
