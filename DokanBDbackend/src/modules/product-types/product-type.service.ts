import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductType } from "./product-type.entity.js";
import type { CreateProductTypeInput, UpdateProductTypeInput } from "./product-type.schema.js";

const repository = () => AppDataSource.getRepository(ProductType);

function createSlug(value: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120).replace(/-+$/g, "");
  if (!slug) throw new AppError(400, "PRODUCT_TYPE_SLUG_REQUIRED", "Provide an English slug when the name cannot form one.");
  return slug;
}

function response(type: ProductType) {
  return {
    id: type.id,
    name: type.name,
    slug: type.slug,
    description: type.description,
    isActive: type.isActive,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
    deletedAt: type.deletedAt,
  };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = repository().createQueryBuilder("type").withDeleted().where("LOWER(type.slug) = :slug", { slug: slug.toLowerCase() });
  if (ignoredId) query.andWhere("type.id != :ignoredId", { ignoredId });
  if (await query.getOne()) throw new AppError(409, "PRODUCT_TYPE_SLUG_EXISTS", "A product type with this slug already exists.");
}

export async function listAdminProductTypes(includeDeleted: boolean) {
  return (await repository().find({ withDeleted: includeDeleted, order: { name: "ASC" } })).map(response);
}

export async function createProductType(input: CreateProductTypeInput) {
  const slug = input.slug ?? createSlug(input.name);
  await assertSlugAvailable(slug);
  const type = repository().create({ name: input.name, slug, description: input.description ?? null, isActive: input.isActive ?? true });
  await repository().save(type);
  return response(type);
}

export async function updateProductType(typeId: string, input: UpdateProductTypeInput) {
  const type = await repository().findOneBy({ id: typeId });
  if (!type) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  if (input.slug !== undefined) { await assertSlugAvailable(input.slug, type.id); type.slug = input.slug; }
  if (input.name !== undefined) type.name = input.name;
  if (input.description !== undefined) type.description = input.description;
  if (input.isActive !== undefined) type.isActive = input.isActive;
  await repository().save(type);
  return response(type);
}

export async function deleteProductType(typeId: string) {
  const type = await repository().findOneBy({ id: typeId });
  if (!type) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  await repository().softRemove(type);
}

export async function restoreProductType(typeId: string) {
  const type = await repository().findOne({ where: { id: typeId }, withDeleted: true });
  if (!type) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  if (!type.deletedAt) throw new AppError(409, "PRODUCT_TYPE_NOT_DELETED", "This product type is not deleted.");
  await repository().restore(type.id);
  type.deletedAt = null;
  return response(type);
}
