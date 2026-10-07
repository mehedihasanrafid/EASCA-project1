import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Category } from "./category.entity.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema.js";

export interface CategoryTreeItem {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryTreeItem[];
}

function categoryRepository() {
  return AppDataSource.getRepository(Category);
}

function createSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");

  if (!slug) {
    throw new AppError(
      400,
      "CATEGORY_SLUG_REQUIRED",
      "Provide an English slug when the category name cannot form one.",
    );
  }

  return slug;
}

function toAdminCategory(category: Category) {
  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
  };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = categoryRepository()
    .createQueryBuilder("category")
    .withDeleted()
    .where("LOWER(category.slug) = :slug", { slug: slug.toLowerCase() });

  if (ignoredId) {
    query.andWhere("category.id != :ignoredId", { ignoredId });
  }

  if (await query.getOne()) {
    throw new AppError(
      409,
      "CATEGORY_SLUG_EXISTS",
      "A category with this slug already exists.",
    );
  }
}

async function getActiveParent(parentId: string) {
  const parent = await categoryRepository().findOneBy({
    id: parentId,
    isActive: true,
  });

  if (!parent) {
    throw new AppError(
      400,
      "CATEGORY_PARENT_INVALID",
      "The parent category does not exist or is inactive.",
    );
  }

  return parent;
}

async function assertNoParentCycle(categoryId: string, parentId: string | null) {
  let currentId = parentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === categoryId || visited.has(currentId)) {
      throw new AppError(
        409,
        "CATEGORY_PARENT_CYCLE",
        "A category cannot be its own parent or descendant.",
      );
    }

    visited.add(currentId);
    const current = await categoryRepository().findOneBy({ id: currentId });

    if (!current) {
      throw new AppError(
        400,
        "CATEGORY_PARENT_INVALID",
        "The parent category does not exist or is deleted.",
      );
    }

    currentId = current.parentId;
  }
}

export async function listPublicCategoryTree() {
  const categories = await categoryRepository().find({
    where: { isActive: true },
    order: { sortOrder: "ASC", name: "ASC" },
  });

  const byId = new Map<string, CategoryTreeItem>();

  for (const category of categories) {
    byId.set(category.id, {
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      children: [],
    });
  }

  const roots: CategoryTreeItem[] = [];

  for (const item of byId.values()) {
    if (!item.parentId) {
      roots.push(item);
      continue;
    }

    // If an ancestor is inactive or deleted, the whole branch stays hidden
    // instead of making a child category appear as a new root.
    byId.get(item.parentId)?.children.push(item);
  }

  return roots;
}

export async function listAdminCategories(includeDeleted: boolean) {
  const categories = await categoryRepository().find({
    withDeleted: includeDeleted,
    order: { sortOrder: "ASC", name: "ASC" },
  });

  return categories.map(toAdminCategory);
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? createSlug(input.name);
  await assertSlugAvailable(slug);

  if (input.parentId) {
    await getActiveParent(input.parentId);
  }

  const repository = categoryRepository();
  const category = repository.create({
    name: input.name,
    slug,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    parentId: input.parentId ?? null,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  });

  await repository.save(category);
  return toAdminCategory(category);
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
) {
  const repository = categoryRepository();
  const category = await repository.findOneBy({ id: categoryId });

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  }

  if (input.slug !== undefined) {
    await assertSlugAvailable(input.slug, category.id);
    category.slug = input.slug;
  }

  if (input.parentId !== undefined) {
    if (input.parentId) {
      await getActiveParent(input.parentId);
    }

    await assertNoParentCycle(category.id, input.parentId);
    category.parentId = input.parentId;
  }

  if (input.name !== undefined) category.name = input.name;
  if (input.description !== undefined) category.description = input.description;
  if (input.imageUrl !== undefined) category.imageUrl = input.imageUrl;
  if (input.isActive !== undefined) category.isActive = input.isActive;
  if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;

  await repository.save(category);
  return toAdminCategory(category);
}

export async function deleteCategory(categoryId: string) {
  const repository = categoryRepository();
  const category = await repository.findOneBy({ id: categoryId });

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  }

  const childCount = await repository.countBy({ parentId: category.id });

  if (childCount > 0) {
    throw new AppError(
      409,
      "CATEGORY_HAS_CHILDREN",
      "Move or delete this category's child categories first.",
    );
  }

  await repository.softRemove(category);
}

export async function restoreCategory(categoryId: string) {
  const repository = categoryRepository();
  const category = await repository.findOne({
    where: { id: categoryId },
    withDeleted: true,
  });

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  }

  if (!category.deletedAt) {
    throw new AppError(
      409,
      "CATEGORY_NOT_DELETED",
      "This category is not deleted.",
    );
  }

  if (category.parentId) {
    await getActiveParent(category.parentId);
  }

  await repository.restore(category.id);
  category.deletedAt = null;
  return toAdminCategory(category);
}
