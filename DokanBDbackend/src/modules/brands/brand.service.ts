import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Brand } from "./brand.entity.js";
import type { CreateBrandInput, UpdateBrandInput } from "./brand.schema.js";

function brandRepository() {
  return AppDataSource.getRepository(Brand);
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
      "BRAND_SLUG_REQUIRED",
      "Provide an English slug when the brand name cannot form one.",
    );
  }

  return slug;
}

function toAdminBrand(brand: Brand) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
    description: brand.description,
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
    deletedAt: brand.deletedAt,
  };
}

async function assertSlugAvailable(slug: string, ignoredId?: string) {
  const query = brandRepository()
    .createQueryBuilder("brand")
    .withDeleted()
    .where("LOWER(brand.slug) = :slug", { slug: slug.toLowerCase() });

  if (ignoredId) query.andWhere("brand.id != :ignoredId", { ignoredId });

  if (await query.getOne()) {
    throw new AppError(
      409,
      "BRAND_SLUG_EXISTS",
      "A brand with this slug already exists.",
    );
  }
}

export async function listPublicBrands() {
  const brands = await brandRepository().find({
    where: { isActive: true },
    order: { name: "ASC" },
  });

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
  }));
}

export async function listAdminBrands(includeDeleted: boolean) {
  const brands = await brandRepository().find({
    withDeleted: includeDeleted,
    order: { name: "ASC" },
  });

  return brands.map(toAdminBrand);
}

export async function createBrand(input: CreateBrandInput) {
  const slug = input.slug ?? createSlug(input.name);
  await assertSlugAvailable(slug);

  const repository = brandRepository();
  const brand = repository.create({
    name: input.name,
    slug,
    logoUrl: input.logoUrl ?? null,
    description: input.description ?? null,
    isActive: input.isActive ?? true,
  });

  await repository.save(brand);
  return toAdminBrand(brand);
}

export async function updateBrand(brandId: string, input: UpdateBrandInput) {
  const repository = brandRepository();
  const brand = await repository.findOneBy({ id: brandId });

  if (!brand) {
    throw new AppError(404, "BRAND_NOT_FOUND", "Brand not found.");
  }

  if (input.slug !== undefined) {
    await assertSlugAvailable(input.slug, brand.id);
    brand.slug = input.slug;
  }

  if (input.name !== undefined) brand.name = input.name;
  if (input.logoUrl !== undefined) brand.logoUrl = input.logoUrl;
  if (input.description !== undefined) brand.description = input.description;
  if (input.isActive !== undefined) brand.isActive = input.isActive;

  await repository.save(brand);
  return toAdminBrand(brand);
}

export async function deleteBrand(brandId: string) {
  const repository = brandRepository();
  const brand = await repository.findOneBy({ id: brandId });

  if (!brand) {
    throw new AppError(404, "BRAND_NOT_FOUND", "Brand not found.");
  }

  await repository.softRemove(brand);
}

export async function restoreBrand(brandId: string) {
  const repository = brandRepository();
  const brand = await repository.findOne({
    where: { id: brandId },
    withDeleted: true,
  });

  if (!brand) {
    throw new AppError(404, "BRAND_NOT_FOUND", "Brand not found.");
  }

  if (!brand.deletedAt) {
    throw new AppError(409, "BRAND_NOT_DELETED", "This brand is not deleted.");
  }

  await repository.restore(brand.id);
  brand.deletedAt = null;
  return toAdminBrand(brand);
}
