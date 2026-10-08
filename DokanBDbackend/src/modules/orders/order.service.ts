import { randomBytes } from "node:crypto";

import type { EntityManager, SelectQueryBuilder } from "typeorm";

import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppDataSource } from "../../database/data-source.js";
import {
  sendOrderPlacedEmail,
  sendOrderStatusEmail,
} from "../../services/mail.service.js";
import { AppError } from "../../utils/app-error.js";
import { Address } from "../addresses/address.entity.js";
import { CartItem } from "../carts/cart-item.entity.js";
import { Cart } from "../carts/cart.entity.js";
import { getActiveCart } from "../carts/cart.service.js";
import { InventoryMovement } from "../inventory/inventory-movement.entity.js";
import { ProductVariant } from "../products/product-variant.entity.js";
import { User } from "../users/user.entity.js";
import { OrderItem } from "./order-item.entity.js";
import { OrderStatusHistory } from "./order-status-history.entity.js";
import { Order } from "./order.entity.js";
import type {
  AdminOrderListQuery,
  AdminOrderStatusInput,
  CancelOrderInput,
  CheckoutInput,
  CheckoutPreviewQuery,
  CustomerOrderListQuery,
  OrderStatus,
} from "./order.schema.js";

const ACTIVE_CART_STATUS = "ACTIVE";
const CONVERTED_CART_STATUS = "CONVERTED";
const CURRENCY = "BDT";
const PAYMENT_METHOD = "COD";
const PENDING_PAYMENT_STATUS = "PENDING";
const MAX_MONEY_MINOR_UNITS = 999_999_999_999n;

const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

async function deliverOrderEmail(
  userId: string,
  order: {
    id: string;
    orderNumber: string;
    orderStatus: string;
    grandTotal: string;
    currency: string;
  },
  kind: "PLACED" | "STATUS",
) {
  if (!env.SMTP_HOST || !env.MAIL_FROM) return;

  const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
  if (!user?.email) return;

  const input = {
    to: user.email,
    recipientName: user.name,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    grandTotal: order.grandTotal,
    currency: order.currency,
    orderUrl: `${env.WEB_ORIGIN.replace(/\/+$/, "")}/account/orders/${order.id}`,
  };

  try {
    if (kind === "PLACED") {
      await sendOrderPlacedEmail(input);
    } else {
      await sendOrderStatusEmail(input);
    }
  } catch (error) {
    logger.error(
      { error, userId, orderId: order.id, orderStatus: order.orderStatus },
      "Order email delivery failed",
    );
  }
}

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

function numberToMinorUnits(value: number) {
  const minorUnits = Math.round(value * 100);

  if (
    !Number.isSafeInteger(minorUnits) ||
    minorUnits < 0 ||
    BigInt(minorUnits) > MAX_MONEY_MINOR_UNITS
  ) {
    throw new Error("Invalid delivery charge configuration.");
  }

  return BigInt(minorUnits);
}

function formatMinorUnits(value: bigint) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}

function createOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomBytes(6).toString("hex").toUpperCase();

  return `DBD-${date}-${randomPart}`;
}

async function lockActiveUser(manager: EntityManager, userId: string) {
  const user = await manager.getRepository(User).findOne({
    where: { id: userId },
    lock: { mode: "pessimistic_write" },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }
}

async function loadLockedVariants(
  manager: EntityManager,
  variantIds: string[],
  includeUnavailable = false,
) {
  if (variantIds.length === 0) {
    return [];
  }

  const query = manager
    .getRepository(ProductVariant)
    .createQueryBuilder("variant");

  if (includeUnavailable) {
    query.withDeleted();
  }

  query
    .innerJoinAndSelect("variant.product", "product")
    .where("variant.id IN (:...variantIds)", { variantIds })
    .orderBy("variant.id", "ASC")
    .setLock("pessimistic_write");

  return query.getMany();
}

function toOrderBase(order: Order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    deliveryCharge: order.deliveryCharge,
    grandTotal: order.grandTotal,
    currency: order.currency,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    deliveryAddress: {
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      area: order.area,
      city: order.city,
      district: order.district,
      division: order.division,
      postalCode: order.postalCode,
      country: order.country,
      isInsideDhaka: order.isInsideDhaka,
    },
    customerNote: order.customerNote,
    placedAt: order.placedAt,
    confirmedAt: order.confirmedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function toOrderItem(item: OrderItem, includeCost: boolean) {
  return {
    id: item.id,
    productId: item.productId,
    productVariantId: item.productVariantId,
    productName: item.productName,
    variantName: item.variantName,
    sku: item.sku,
    barcode: item.barcode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    lineTotal: item.lineTotal,
    ...(includeCost ? { unitCost: item.unitCost } : {}),
  };
}

function toStatusHistory(
  history: OrderStatusHistory,
  includeInternalDetails: boolean,
) {
  return {
    id: history.id,
    oldStatus: history.oldStatus,
    newStatus: history.newStatus,
    createdAt: history.createdAt,
    ...(includeInternalDetails
      ? { changedById: history.changedById, note: history.note }
      : {}),
  };
}

async function loadItemCounts(orderIds: string[]) {
  if (orderIds.length === 0) {
    return new Map<string, { itemCount: number; totalQuantity: number }>();
  }

  const rows = await AppDataSource.getRepository(OrderItem)
    .createQueryBuilder("item")
    .select("item.order_id", "orderId")
    .addSelect("COUNT(item.id)", "itemCount")
    .addSelect("SUM(item.quantity)", "totalQuantity")
    .where("item.order_id IN (:...orderIds)", { orderIds })
    .groupBy("item.order_id")
    .getRawMany<{
      orderId: string;
      itemCount: string;
      totalQuantity: string;
    }>();

  return new Map(
    rows.map((row) => [
      String(row.orderId),
      {
        itemCount: Number(row.itemCount),
        totalQuantity: Number(row.totalQuantity),
      },
    ]),
  );
}

async function buildOrderDetail(order: Order, includeInternalDetails: boolean) {
  const [items, statusHistory] = await Promise.all([
    AppDataSource.getRepository(OrderItem).find({
      where: { orderId: order.id },
      order: { id: "ASC" },
    }),
    AppDataSource.getRepository(OrderStatusHistory).find({
      where: { orderId: order.id },
      order: { createdAt: "ASC", id: "ASC" },
    }),
  ]);

  return {
    ...toOrderBase(order),
    ...(includeInternalDetails
      ? {
          user: {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone,
          },
          adminNote: order.adminNote,
        }
      : {}),
    items: items.map((item) => toOrderItem(item, includeInternalDetails)),
    statusHistory: statusHistory.map((history) =>
      toStatusHistory(history, includeInternalDetails),
    ),
  };
}

function applyListFilters(
  query: SelectQueryBuilder<Order>,
  filters: CustomerOrderListQuery | AdminOrderListQuery,
) {
  if (filters.status) {
    query.andWhere("order.order_status = :orderStatus", {
      orderStatus: filters.status,
    });
  }

  if ("paymentStatus" in filters && filters.paymentStatus) {
    query.andWhere("order.payment_status = :paymentStatus", {
      paymentStatus: filters.paymentStatus,
    });
  }

  if ("userId" in filters && filters.userId) {
    query.andWhere("order.user_id = :filterUserId", {
      filterUserId: filters.userId,
    });
  }

  if ("search" in filters && filters.search) {
    query.andWhere(
      "(order.order_number LIKE :search OR order.recipient_name LIKE :search OR order.recipient_phone LIKE :search)",
      { search: `%${filters.search}%` },
    );
  }
}

async function cancelLockedOrder(
  manager: EntityManager,
  order: Order,
  actorUserId: string,
  note: string | null,
  allowConfirmed: boolean,
) {
  const cancellableStatuses = allowConfirmed
    ? ["PENDING", "CONFIRMED"]
    : ["PENDING"];

  if (!cancellableStatuses.includes(order.orderStatus)) {
    throw new AppError(
      409,
      "ORDER_CANNOT_BE_CANCELLED",
      `An order in ${order.orderStatus} status cannot be cancelled.`,
    );
  }

  if (order.paymentStatus !== PENDING_PAYMENT_STATUS) {
    throw new AppError(
      409,
      "PAID_ORDER_REQUIRES_REFUND",
      "This order must be refunded through the payment workflow.",
    );
  }

  const orderItems = await manager.getRepository(OrderItem).find({
    where: { orderId: order.id },
    order: { productVariantId: "ASC", id: "ASC" },
  });
  const quantityByVariant = new Map<string, number>();

  for (const item of orderItems) {
    if (!item.productVariantId) {
      throw new AppError(
        409,
        "STOCK_RESTORE_UNAVAILABLE",
        "Stock for this order cannot be restored automatically.",
      );
    }

    quantityByVariant.set(
      item.productVariantId,
      (quantityByVariant.get(item.productVariantId) ?? 0) + item.quantity,
    );
  }

  const variantIds = [...quantityByVariant.keys()].sort((left, right) =>
    BigInt(left) < BigInt(right) ? -1 : BigInt(left) > BigInt(right) ? 1 : 0,
  );
  const variants = await loadLockedVariants(manager, variantIds, true);

  if (variants.length !== variantIds.length) {
    throw new AppError(
      409,
      "STOCK_RESTORE_UNAVAILABLE",
      "Stock for this order cannot be restored automatically.",
    );
  }

  const movements: InventoryMovement[] = [];

  for (const variant of variants) {
    const quantity = quantityByVariant.get(variant.id) ?? 0;
    const quantityBefore = variant.stockQuantity;
    const quantityAfter = quantityBefore + quantity;

    if (!Number.isSafeInteger(quantityAfter) || quantityAfter > 2_147_483_647) {
      throw new AppError(
        409,
        "STOCK_LIMIT_EXCEEDED",
        "Stock cannot be restored because the quantity limit would be exceeded.",
      );
    }

    variant.stockQuantity = quantityAfter;
    movements.push(
      manager.getRepository(InventoryMovement).create({
        productVariantId: variant.id,
        movementType: "CANCELLATION",
        quantity,
        quantityBefore,
        quantityAfter,
        referenceType: "ORDER",
        referenceId: order.id,
        note: `Stock restored after cancellation of ${order.orderNumber}.`,
        createdById: actorUserId,
      }),
    );
  }

  await manager.getRepository(ProductVariant).save(variants);
  await manager.getRepository(InventoryMovement).save(movements);

  const previousStatus = order.orderStatus;
  order.orderStatus = "CANCELLED";
  order.cancelledAt = new Date();
  await manager.getRepository(Order).save(order);

  await manager.getRepository(OrderStatusHistory).save(
    manager.getRepository(OrderStatusHistory).create({
      orderId: order.id,
      oldStatus: previousStatus,
      newStatus: "CANCELLED",
      changedById: actorUserId,
      note,
    }),
  );
}

export async function previewCheckout(
  userId: string,
  input: CheckoutPreviewQuery,
) {
  const address = await AppDataSource.getRepository(Address).findOneBy({
    id: input.addressId,
    userId,
  });

  if (!address) {
    throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found.");
  }

  const cart = await getActiveCart(userId);

  if (cart.items.length === 0) {
    throw new AppError(409, "CART_EMPTY", "Your cart is empty.");
  }

  if (cart.items.some((item) => !item.available)) {
    throw new AppError(
      409,
      "CART_ITEM_UNAVAILABLE",
      "One or more cart items are no longer available.",
    );
  }

  const subtotal = toMinorUnits(cart.totals.subtotal);
  const deliveryCharge = numberToMinorUnits(
    address.isInsideDhaka
      ? env.DELIVERY_INSIDE_DHAKA
      : env.DELIVERY_OUTSIDE_DHAKA,
  );
  const grandTotal = subtotal + deliveryCharge;

  if (grandTotal > MAX_MONEY_MINOR_UNITS) {
    throw new AppError(
      409,
      "ORDER_TOTAL_TOO_LARGE",
      "The cart total is too large to create an order.",
    );
  }

  return {
    addressId: address.id,
    isInsideDhaka: address.isInsideDhaka,
    subtotal: formatMinorUnits(subtotal),
    discountTotal: "0.00",
    deliveryCharge: formatMinorUnits(deliveryCharge),
    grandTotal: formatMinorUnits(grandTotal),
    currency: CURRENCY,
    paymentMethod: PAYMENT_METHOD,
  };
}

export async function checkout(userId: string, input: CheckoutInput) {
  const orderId = await AppDataSource.transaction(async (manager) => {
    await lockActiveUser(manager, userId);

    const address = await manager.getRepository(Address).findOneBy({
      id: input.addressId,
      userId,
    });

    if (!address) {
      throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found.");
    }

    const cart = await manager.getRepository(Cart).findOne({
      where: { userId, status: ACTIVE_CART_STATUS },
      order: { createdAt: "DESC" },
      lock: { mode: "pessimistic_write" },
    });

    if (!cart) {
      throw new AppError(409, "ACTIVE_CART_NOT_FOUND", "Active cart not found.");
    }

    const cartItems = await manager.getRepository(CartItem).find({
      where: { cartId: cart.id },
      order: { productVariantId: "ASC", id: "ASC" },
    });

    if (cartItems.length === 0) {
      throw new AppError(409, "CART_EMPTY", "Your cart is empty.");
    }

    const variantIds = cartItems.map((item) => item.productVariantId);
    const variants = await loadLockedVariants(manager, variantIds);
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    if (variantById.size !== new Set(variantIds).size) {
      throw new AppError(
        409,
        "CART_ITEM_UNAVAILABLE",
        "One or more cart items are no longer available.",
      );
    }

    let subtotal = 0n;
    const preparedItems: Array<{
      cartItem: CartItem;
      variant: ProductVariant;
      unitPrice: bigint;
      lineTotal: bigint;
    }> = [];

    for (const cartItem of cartItems) {
      const variant = variantById.get(cartItem.productVariantId);

      if (
        !variant ||
        !variant.isActive ||
        !variant.product.isActive ||
        variant.product.status !== "ACTIVE"
      ) {
        throw new AppError(
          409,
          "CART_ITEM_UNAVAILABLE",
          "One or more cart items are no longer available.",
        );
      }

      if (cartItem.quantity <= 0 || cartItem.quantity > variant.stockQuantity) {
        throw new AppError(
          409,
          "INSUFFICIENT_STOCK",
          `${variant.product.name} does not have enough stock.`,
        );
      }

      const unitPrice = toMinorUnits(variant.price);

      if (unitPrice < 0n) {
        throw new AppError(
          500,
          "INVALID_PRODUCT_PRICE",
          "A product has an invalid price configuration.",
        );
      }

      const lineTotal = unitPrice * BigInt(cartItem.quantity);
      subtotal += lineTotal;
      preparedItems.push({ cartItem, variant, unitPrice, lineTotal });
    }

    const deliveryCharge = numberToMinorUnits(
      address.isInsideDhaka
        ? env.DELIVERY_INSIDE_DHAKA
        : env.DELIVERY_OUTSIDE_DHAKA,
    );
    const grandTotal = subtotal + deliveryCharge;

    if (grandTotal > MAX_MONEY_MINOR_UNITS) {
      throw new AppError(
        409,
        "ORDER_TOTAL_TOO_LARGE",
        "The cart total is too large to create an order.",
      );
    }

    const now = new Date();
    const orderRepository = manager.getRepository(Order);
    const order = orderRepository.create({
      orderNumber: createOrderNumber(),
      userId,
      orderStatus: "PENDING",
      paymentMethod: PAYMENT_METHOD,
      paymentStatus: PENDING_PAYMENT_STATUS,
      subtotal: formatMinorUnits(subtotal),
      discountTotal: "0.00",
      deliveryCharge: formatMinorUnits(deliveryCharge),
      grandTotal: formatMinorUnits(grandTotal),
      currency: CURRENCY,
      recipientName: address.recipientName,
      recipientPhone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      area: address.area,
      city: address.city,
      district: address.district,
      division: address.division,
      postalCode: address.postalCode,
      country: address.country,
      isInsideDhaka: address.isInsideDhaka,
      customerNote: input.customerNote ?? null,
      adminNote: null,
      placedAt: now,
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
    });

    await orderRepository.save(order);

    const orderItems = preparedItems.map(({ cartItem, variant, unitPrice, lineTotal }) =>
      manager.getRepository(OrderItem).create({
        orderId: order.id,
        productId: variant.productId,
        productVariantId: variant.id,
        productName: variant.product.name,
        variantName: variant.variantName,
        sku: variant.sku,
        barcode: variant.barcode,
        quantity: cartItem.quantity,
        unitPrice: formatMinorUnits(unitPrice),
        unitCost: variant.costPrice,
        discountAmount: "0.00",
        lineTotal: formatMinorUnits(lineTotal),
      }),
    );
    const movements: InventoryMovement[] = [];

    for (const { cartItem, variant } of preparedItems) {
      const quantityBefore = variant.stockQuantity;
      const quantityAfter = quantityBefore - cartItem.quantity;

      variant.stockQuantity = quantityAfter;
      movements.push(
        manager.getRepository(InventoryMovement).create({
          productVariantId: variant.id,
          movementType: "SALE",
          quantity: -cartItem.quantity,
          quantityBefore,
          quantityAfter,
          referenceType: "ORDER",
          referenceId: order.id,
          note: `Stock deducted for ${order.orderNumber}.`,
          createdById: userId,
        }),
      );
    }

    await manager.getRepository(OrderItem).save(orderItems);
    await manager.getRepository(ProductVariant).save(variants);
    await manager.getRepository(InventoryMovement).save(movements);
    await manager.getRepository(OrderStatusHistory).save(
      manager.getRepository(OrderStatusHistory).create({
        orderId: order.id,
        oldStatus: null,
        newStatus: "PENDING",
        changedById: userId,
        note: "Order placed by customer.",
      }),
    );

    cart.status = CONVERTED_CART_STATUS;
    cart.updatedAt = now;
    await manager.getRepository(Cart).save(cart);

    return order.id;
  });

  const order = await getCustomerOrder(userId, orderId);
  await deliverOrderEmail(userId, order, "PLACED");
  return order;
}

export async function listCustomerOrders(
  userId: string,
  filters: CustomerOrderListQuery,
) {
  const query = AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .where("order.user_id = :userId", { userId });

  applyListFilters(query, filters);
  query
    .orderBy("order.created_at", "DESC")
    .addOrderBy("order.id", "DESC")
    .skip((filters.page - 1) * filters.limit)
    .take(filters.limit);

  const [orders, total] = await query.getManyAndCount();
  const counts = await loadItemCounts(orders.map((order) => order.id));

  return {
    orders: orders.map((order) => ({
      ...toOrderBase(order),
      ...(counts.get(order.id) ?? { itemCount: 0, totalQuantity: 0 }),
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await AppDataSource.getRepository(Order).findOneBy({
    id: orderId,
    userId,
  });

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  return buildOrderDetail(order, false);
}

export async function cancelCustomerOrder(
  userId: string,
  orderId: string,
  input: CancelOrderInput,
) {
  await AppDataSource.transaction(async (manager) => {
    const order = await manager
      .getRepository(Order)
      .createQueryBuilder("order")
      .where("order.id = :orderId", { orderId })
      .andWhere("order.user_id = :userId", { userId })
      .setLock("pessimistic_write")
      .getOne();

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
    }

    await cancelLockedOrder(
      manager,
      order,
      userId,
      input.note ?? "Cancelled by customer.",
      false,
    );
  });

  const order = await getCustomerOrder(userId, orderId);
  await deliverOrderEmail(userId, order, "STATUS");
  return order;
}

export async function listAdminOrders(filters: AdminOrderListQuery) {
  const query = AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .withDeleted()
    .innerJoinAndSelect("order.user", "user");

  applyListFilters(query, filters);
  query
    .orderBy("order.created_at", "DESC")
    .addOrderBy("order.id", "DESC")
    .skip((filters.page - 1) * filters.limit)
    .take(filters.limit);

  const [orders, total] = await query.getManyAndCount();
  const counts = await loadItemCounts(orders.map((order) => order.id));

  return {
    orders: orders.map((order) => ({
      ...toOrderBase(order),
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      ...(counts.get(order.id) ?? { itemCount: 0, totalQuantity: 0 }),
    })),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getAdminOrder(orderId: string) {
  const order = await AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .withDeleted()
    .innerJoinAndSelect("order.user", "user")
    .where("order.id = :orderId", { orderId })
    .getOne();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  return buildOrderDetail(order, true);
}

export async function updateAdminOrderStatus(
  actorUserId: string,
  orderId: string,
  input: AdminOrderStatusInput,
) {
  await AppDataSource.transaction(async (manager) => {
    const order = await manager
      .getRepository(Order)
      .createQueryBuilder("order")
      .where("order.id = :orderId", { orderId })
      .setLock("pessimistic_write")
      .getOne();

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
    }

    if (input.status === "CANCELLED") {
      await cancelLockedOrder(
        manager,
        order,
        actorUserId,
        input.note ?? "Cancelled by administrator.",
        true,
      );
      return;
    }

    const expectedStatus = NEXT_ORDER_STATUS[order.orderStatus as OrderStatus];

    if (expectedStatus !== input.status) {
      throw new AppError(
        409,
        "INVALID_ORDER_STATUS_TRANSITION",
        `Order status cannot change from ${order.orderStatus} to ${input.status}.`,
      );
    }

    const previousStatus = order.orderStatus;
    const now = new Date();
    order.orderStatus = input.status;

    if (input.status === "CONFIRMED") {
      order.confirmedAt = now;
    } else if (input.status === "SHIPPED") {
      order.shippedAt = now;
    } else if (input.status === "DELIVERED") {
      order.deliveredAt = now;
    }

    await manager.getRepository(Order).save(order);
    await manager.getRepository(OrderStatusHistory).save(
      manager.getRepository(OrderStatusHistory).create({
        orderId: order.id,
        oldStatus: previousStatus,
        newStatus: input.status,
        changedById: actorUserId,
        note: input.note ?? null,
      }),
    );
  });

  const order = await getAdminOrder(orderId);
  if (order.user) {
    await deliverOrderEmail(order.user.id, order, "STATUS");
  }
  return order;
}
