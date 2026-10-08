import type { CategoryOption } from "../../../api/catalog";

export interface FlatCategoryOption extends CategoryOption {
  depth: number;
}

export function flattenCategories(
  categories: CategoryOption[],
  depth = 0,
): FlatCategoryOption[] {
  return categories.flatMap((category) => [
    { ...category, depth },
    ...flattenCategories(category.children, depth + 1),
  ]);
}
