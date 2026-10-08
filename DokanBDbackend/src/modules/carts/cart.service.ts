import { In, type EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductMedia } from "../products/product-media.entity.js";
import { ProductVariant } from "../products/product-variant.entity.js";
import { User } from "../users/user.entity.js";
import { CartItem } from "./cart-item.entity.js";
import { Cart } from "./cart.entity.js";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.schema.js";

const ACTIVE_CART_STATUS = "ACTIVE";

function toMinorUnits(value: string) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);

  if (!match) {
    throw new Error(`Invalid database money value: ${value}`);
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = BigInt(match[2] ?? "0");
  const fraction = BigInt((match[3] ?? "").padEnd(2, "0"));

  return sign * (whole * 100n + fraction);
}

function formatMinorUnits(value: bigint) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}

async function lockUser(manager: EntityManager, userId: string) {
  const user = await manager.getRepository(User).findOne({
    where: { id: userId },
    lock: { mode: "pessimistic_write" },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }
}

async function findActiveCart(manager: EntityManager, userId: string) {
  return manager.getRepository(Cart).findOne({
    where: { userId, status: ACTIVE_CART_STATUS },
    order: { createdAt: "DESC" },
  });
}

async function getOrCreateActiveCart(manager: EntityManager, userId: string) {
  await lockUser(manager, userId);

  const existingCart = await findActiveCart(manager, userId);

  if (existingCart) {
    return existingCart;
  }

  const cartRepository = manager.getRepository(Cart);
  const cart = cartRepository.create({
    userId,
    status: ACTIVE_CART_STATUS,
  });

  return cartRepository.save(cart);
}

async function findAvailableVariant(
  manager: EntityManager,
  productVariantId: string,
) {
  const variant = await manager
    .getRepository(ProductVariant)
    .createQueryBuilder("variant")
    .innerJoinAndSelect("variant.product", "product")
    .where("variant.id = :productVariantId", { productVariantId })
    .andWhere("variant.is_active = :isActive", { isActive: true })
    .andWhere("product.is_active = :isActive", { isActive: true })
    .getOne();

  if (!variant) {
    throw new AppError(
      409,
      "PRODUCT_VARIANT_UNAVAILABLE",
      "The selected product variant is unavailable.",
    );
  }

  return variant;
}

function assertStock(variant: ProductVariant, quantity: number) {
  if (quantity > variant.stockQuantity) {
    throw new AppError(
      409,
      "INSUFFICIENT_STOCK",
      `Only ${variant.stockQuantity} item(s) are currently available.`,
    );
  }
}

async function touchCart(manager: EntityManager, cart: Cart) {
  cart.updatedAt = new Date();
  await manager.getRepository(Cart).save(cart);
}

async function buildCartView(cartId: string, userId: string) {
  const cart = await AppDataSource.getRepository(Cart).findOneBy({
    id: cartId,
    userId,
    status: ACTIVE_CART_STATUS,
  });

  if (!cart) {
    throw new AppError(404, "CART_NOT_FOUND", "Active cart not found.");
  }

  const items = await AppDataSource.getRepository(CartItem)
    .createQueryBuilder("item")
    .withDeleted()
    .innerJoinAndSelect("item.productVariant", "variant")
    .innerJoinAndSelect("variant.product", "product")
    .where("item.cart_id = :cartId", { cartId })
    .orderBy("item.created_at", "ASC")
    .getMany();

  const productIds = [...new Set(items.map((item) => item.productVariant.product.id))];
  const imageMedia = productIds.length > 0
    ? await AppDataSource.getRepository(ProductMedia).find({
        where: {
          productId: In(productIds),
          mediaType: "IMAGE",
        },
        order: {
          isPrimary: "DESC",
          sortOrder: "ASC",
          createdAt: "ASC",
        },
      })
    : [];
  const primaryImageByProduct = new Map<string, ProductMedia>();

  for (const media of imageMedia) {
    if (!primaryImageByProduct.has(media.productId)) {
      primaryImageByProduct.set(media.productId, media);
    }
  }

  let subtotal = 0n;
  let totalQuantity = 0;

  const publicItems = items.map((item) => {
    const unitPrice = toMinorUnits(item.productVariant.price);
    const lineTotal = unitPrice * BigInt(item.quantity);
    const product = item.productVariant.product;
    const primaryImage = primaryImageByProduct.get(product.id);
    const available =
      item.productVariant.deletedAt === null &&
      product.deletedAt === null &&
      item.productVariant.isActive &&
      product.isActive &&
      item.quantity <= item.productVariant.stockQuantity;

    subtotal += lineTotal;
    totalQuantity += item.quantity;

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice: formatMinorUnits(unitPrice),
      lineTotal: formatMinorUnits(lineTotal),
      available,
      productVariant: {
        id: item.productVariant.id,
        sku: item.productVariant.sku,
        barcode: item.productVariant.barcode,
        variantName: item.productVariant.variantName,
        color: item.productVariant.color,
        size: item.productVariant.size,
        stockQuantity: item.productVariant.stockQuantity,
      },
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        primaryImage: primaryImage
          ? {
              url: primaryImage.url,
              thumbnailUrl: primaryImage.thumbnailUrl,
              altText: primaryImage.altText,
            }
          : null,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  return {
    id: cart.id,
    status: cart.status,
    items: publicItems,
    totals: {
      itemCount: publicItems.length,
      totalQuantity,
      subtotal: formatMinorUnits(subtotal),
      currency: "BDT",
    },
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export async function getActiveCart(userId: string) {
  const cart = await AppDataSource.transaction((manager) =>
    getOrCreateActiveCart(manager, userId),
  );

  return buildCartView(cart.id, userId);
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);
    const variant = await findAvailableVariant(manager, input.productVariantId);
    const itemRepository = manager.getRepository(CartItem);
    const existingItem = await itemRepository.findOneBy({
      cartId: cart.id,
      productVariantId: variant.id,
    });
    const nextQuantity = (existingItem?.quantity ?? 0) + input.quantity;

    if (nextQuantity > 2_147_483_647) {
      throw new AppError(400, "QUANTITY_TOO_LARGE", "Quantity is too large.");
    }

    assertStock(variant, nextQuantity);

    const item = existingItem ??
      itemRepository.create({
        cartId: cart.id,
        productVariantId: variant.id,
        quantity: 0,
      });

    item.quantity = nextQuantity;
    await itemRepository.save(item);
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput,
) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);
    const itemRepository = manager.getRepository(CartItem);
    const item = await itemRepository.findOneBy({ id: itemId, cartId: cart.id });

    if (!item) {
      throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found.");
    }

    const variant = await findAvailableVariant(manager, item.productVariantId);
    assertStock(variant, input.quantity);

    item.quantity = input.quantity;
    await itemRepository.save(item);
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);
    const itemRepository = manager.getRepository(CartItem);
    const item = await itemRepository.findOneBy({ id: itemId, cartId: cart.id });

    if (!item) {
      throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found.");
    }

    await itemRepository.remove(item);
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}

export async function clearCart(userId: string) {
  const cartId = await AppDataSource.transaction(async (manager) => {
    const cart = await getOrCreateActiveCart(manager, userId);

    await manager.getRepository(CartItem).delete({ cartId: cart.id });
    await touchCart(manager, cart);

    return cart.id;
  });

  return buildCartView(cartId, userId);
}
