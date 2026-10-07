import { unlink } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { AppDataSource } from "../../database/data-source.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { ProductMedia } from "./product-media.entity.js";
import type {
  CreateProductMediaInput,
  UpdateProductMediaInput,
} from "./product-media.schema.js";
import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";

function publicMedia(media: ProductMedia) {
  return {
    id: media.id,
    productId: media.productId,
    variantId: media.variantId,
    type: media.mediaType,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    altText: media.altText,
    sortOrder: media.sortOrder,
    isPrimary: media.isPrimary,
    createdAt: media.createdAt,
  };
}

async function removePhysicalFile(url: string) {
  if (!url.startsWith("/uploads/products/")) return;
  await unlink(resolve(env.UPLOAD_DIR, "products", basename(url))).catch(
    () => undefined,
  );
}

export async function addProductMedia(
  productId: string,
  files: Express.Multer.File[],
  input: CreateProductMediaInput,
) {
  if (files.length === 0) {
    throw new AppError(400, "MEDIA_REQUIRED", "Select at least one image or video.");
  }

  const oversizedImage = files.find(
    (file) => file.mimetype.startsWith("image/") && file.size > env.MAX_UPLOAD_BYTES,
  );
  if (oversizedImage) {
    throw new AppError(
      400,
      "IMAGE_TOO_LARGE",
      `Images must be ${Math.floor(env.MAX_UPLOAD_BYTES / 1024 / 1024)} MB or smaller.`,
    );
  }

  const product = await AppDataSource.getRepository(Product).findOneBy({
    id: productId,
  });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  if (input.variantId) {
    const variant = await AppDataSource.getRepository(ProductVariant).findOneBy({
      id: input.variantId,
      productId,
    });
    if (!variant) {
      throw new AppError(400, "VARIANT_INVALID", "Variant does not belong to this product.");
    }
  }

  const repository = AppDataSource.getRepository(ProductMedia);
  const existing = await repository.find({
    where: { productId },
    order: { sortOrder: "ASC" },
  });

  if (existing.length + files.length > 4) {
    throw new AppError(
      400,
      "PRODUCT_MEDIA_LIMIT",
      "A product can have at most four media items.",
    );
  }

  let hasPrimaryImage = existing.some(
    (media) => media.mediaType === "IMAGE" && media.isPrimary,
  );
  const created = files.map((file, index) => {
    const mediaType = file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE";
    const isPrimary = mediaType === "IMAGE" && !hasPrimaryImage;
    if (isPrimary) hasPrimaryImage = true;

    return repository.create({
      productId,
      variantId: input.variantId ?? null,
      mediaType,
      url: `/uploads/products/${file.filename}`,
      thumbnailUrl: null,
      altText: input.altText ?? product.name,
      sortOrder: existing.length + index,
      isPrimary,
    });
  });

  await repository.save(created);
  return created.map(publicMedia);
}

export async function updateProductImage(
  productId: string,
  mediaId: string,
  input: UpdateProductMediaInput,
) {
  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductMedia);
    const media = await repository.findOneBy({ id: mediaId, productId });
    if (!media) {
      throw new AppError(404, "PRODUCT_MEDIA_NOT_FOUND", "Product image not found.");
    }

    if (input.isPrimary === true && media.mediaType !== "IMAGE") {
      throw new AppError(
        400,
        "VIDEO_PRIMARY_INVALID",
        "A video cannot be the primary catalog image.",
      );
    }

    if (input.isPrimary === true) {
      await repository.update({ productId, isPrimary: true }, { isPrimary: false });
    }
    if (input.altText !== undefined) media.altText = input.altText;
    if (input.sortOrder !== undefined) media.sortOrder = input.sortOrder;
    if (input.isPrimary !== undefined) media.isPrimary = input.isPrimary;

    await repository.save(media);
    return publicMedia(media);
  });
}

export async function deleteProductImage(productId: string, mediaId: string) {
  const repository = AppDataSource.getRepository(ProductMedia);
  const media = await repository.findOneBy({ id: mediaId, productId });
  if (!media) {
    throw new AppError(404, "PRODUCT_MEDIA_NOT_FOUND", "Product image not found.");
  }

  await repository.remove(media);
  await removePhysicalFile(media.url);
}

export async function listProductMedia(productId: string) {
  const product = await AppDataSource.getRepository(Product).findOneBy({ id: productId });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  }

  const media = await AppDataSource.getRepository(ProductMedia).find({
    where: { productId },
    order: { sortOrder: "ASC", id: "ASC" },
  });

  return media.map(publicMedia);
}

export async function cleanupUploadedProductImages(files: Express.Multer.File[]) {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
}
