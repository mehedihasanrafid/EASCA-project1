import type { ProductTypeAttributeAssignment } from "../../../api/adminCatalog";

export const SKIP_OPTION_VALUE = "__skip_option_value__";

export interface VariantPathSource {
  key: string;
  optionValueIds: string[];
}

export interface VariantPathStockSource extends VariantPathSource {
  stockQuantity: string | number;
}

export interface VariantPathNode {
  valueId: string;
  label: string;
  code: string;
  colorHex: string | null;
  attributeId: string;
  attributeName: string;
  variantKeys: string[];
  terminalVariantKeys: string[];
  children: VariantPathNode[];
}

export const variantPathSignature = (ids: string[]) => [...ids].sort().join(":");

export function changeVariantPathSelection(
  assignments: ProductTypeAttributeAssignment[],
  current: Record<string, string>,
  attributeId: string,
  valueId: string,
) {
  const changedIndex = assignments.findIndex((item) => item.attributeId === attributeId);
  if (changedIndex < 0) return current;

  const next = { ...current, [attributeId]: valueId };
  // Product Type templates created before product-specific parents existed are
  // still a simple ordered chain.
  if (!assignments.some((assignment) => Object.hasOwn(assignment, "parentAttributeId"))) {
    for (const assignment of assignments.slice(changedIndex + 1)) {
      delete next[assignment.attributeId];
    }
    return next;
  }
  const descendants = new Set<string>([attributeId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const assignment of assignments) {
      if (assignment.parentAttributeId && descendants.has(assignment.parentAttributeId) && !descendants.has(assignment.attributeId)) {
        descendants.add(assignment.attributeId);
        changed = true;
      }
    }
  }
  descendants.delete(attributeId);
  for (const descendantId of descendants) {
    delete next[descendantId];
  }
  return next;
}

export function selectedVariantPathIds(
  assignments: ProductTypeAttributeAssignment[],
  selection: Record<string, string>,
) {
  return assignments.flatMap((assignment) => {
    const valueId = selection[assignment.attributeId];
    return valueId && valueId !== SKIP_OPTION_VALUE ? [valueId] : [];
  });
}

export function clearDeepestVariantPathChoice(
  assignments: ProductTypeAttributeAssignment[],
  current: Record<string, string>,
) {
  const next = { ...current };
  const deepest = [...assignments]
    .reverse()
    .find((assignment) => Object.hasOwn(current, assignment.attributeId));
  if (deepest) delete next[deepest.attributeId];
  return next;
}

export function buildVariantPathTree(
  assignments: ProductTypeAttributeAssignment[],
  variants: VariantPathSource[],
): VariantPathNode[] {
  const assignmentOrder = new Map(
    assignments.map((assignment, index) => [assignment.attributeId, index]),
  );
  const valueDetails = new Map(assignments.flatMap((assignment) =>
    assignment.attribute.values.map((value) => [value.id, {
      ...value,
      attributeId: assignment.attributeId,
      attributeName: assignment.attribute.name,
    }] as const),
  ));
  const roots: VariantPathNode[] = [];

  for (const variant of variants) {
    const values = variant.optionValueIds
      .map((id) => valueDetails.get(id))
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .sort((left, right) =>
        (assignmentOrder.get(left.attributeId) ?? 0) -
        (assignmentOrder.get(right.attributeId) ?? 0),
      );

    let siblings = roots;
    let lastNode: VariantPathNode | null = null;
    for (const value of values) {
      let node = siblings.find((item) => item.valueId === value.id);
      if (!node) {
        node = {
          valueId: value.id,
          label: value.label,
          code: value.code,
          colorHex: value.colorHex,
          attributeId: value.attributeId,
          attributeName: value.attributeName,
          variantKeys: [],
          terminalVariantKeys: [],
          children: [],
        };
        siblings.push(node);
      }
      node.variantKeys.push(variant.key);
      lastNode = node;
      siblings = node.children;
    }
    lastNode?.terminalVariantKeys.push(variant.key);
  }

  return roots;
}

export function analyzeVariantPathRemoval<T extends VariantPathStockSource>(
  variantKeys: string[],
  variants: T[],
) {
  const keySet = new Set(variantKeys);
  const affected = variants.filter((variant) => keySet.has(variant.key));
  return {
    affected,
    stocked: affected.filter((variant) => Number(variant.stockQuantity) > 0),
  };
}
