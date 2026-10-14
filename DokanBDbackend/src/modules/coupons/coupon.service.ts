import type { EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { CouponRedemption } from "./coupon-redemption.entity.js";
import { Coupon } from "./coupon.entity.js";
import type { CreateCouponInput, UpdateCouponInput } from "./coupon.schema.js";

function money(value: number) { return value.toFixed(2); }
function date(value: string | null | undefined) { return value === undefined ? undefined : value === null ? null : new Date(value); }
function minor(value: string) { return BigInt(Math.round(Number(value) * 100)); }
export function formatCouponMoney(value: bigint) {
  return `${value / 100n}.${(value % 100n).toString().padStart(2, "0")}`;
}

function response(coupon: Coupon) {
  return {
    id: coupon.id, code: coupon.code, name: coupon.name, discountType: coupon.discountType,
    value: coupon.value, minimumSubtotal: coupon.minimumSubtotal, maximumDiscount: coupon.maximumDiscount,
    startsAt: coupon.startsAt, endsAt: coupon.endsAt, usageLimit: coupon.usageLimit,
    perCustomerLimit: coupon.perCustomerLimit, usedCount: coupon.usedCount, isActive: coupon.isActive,
    createdAt: coupon.createdAt, updatedAt: coupon.updatedAt, deletedAt: coupon.deletedAt,
  };
}

export async function listCoupons(includeDeleted: boolean) {
  return (await AppDataSource.getRepository(Coupon).find({ withDeleted: includeDeleted, order: { createdAt: "DESC" } })).map(response);
}

export async function createCoupon(input: CreateCouponInput) {
  const repository = AppDataSource.getRepository(Coupon);
  if (await repository.findOne({ where: { code: input.code }, withDeleted: true })) throw new AppError(409, "COUPON_CODE_EXISTS", "This coupon code already exists.");
  const coupon = repository.create({
    ...input, value: money(input.value), minimumSubtotal: money(input.minimumSubtotal ?? 0),
    maximumDiscount: input.maximumDiscount == null ? null : money(input.maximumDiscount),
    startsAt: date(input.startsAt) ?? null, endsAt: date(input.endsAt) ?? null,
    usageLimit: input.usageLimit ?? null, perCustomerLimit: input.perCustomerLimit ?? 1,
    usedCount: 0, isActive: input.isActive ?? true,
  });
  await repository.save(coupon);
  return response(coupon);
}

export async function updateCoupon(couponId: string, input: UpdateCouponInput) {
  const repository = AppDataSource.getRepository(Coupon);
  const coupon = await repository.findOneBy({ id: couponId });
  if (!coupon) throw new AppError(404, "COUPON_NOT_FOUND", "Coupon not found.");
  if (input.code && input.code !== coupon.code && await repository.findOne({ where: { code: input.code }, withDeleted: true })) throw new AppError(409, "COUPON_CODE_EXISTS", "This coupon code already exists.");
  if (input.code !== undefined) coupon.code = input.code;
  if (input.name !== undefined) coupon.name = input.name;
  if (input.discountType !== undefined) coupon.discountType = input.discountType;
  if (input.value !== undefined) coupon.value = money(input.value);
  if (input.minimumSubtotal !== undefined) coupon.minimumSubtotal = money(input.minimumSubtotal);
  if (input.maximumDiscount !== undefined) coupon.maximumDiscount = input.maximumDiscount === null ? null : money(input.maximumDiscount);
  if (input.startsAt !== undefined) coupon.startsAt = date(input.startsAt) ?? null;
  if (input.endsAt !== undefined) coupon.endsAt = date(input.endsAt) ?? null;
  if (input.usageLimit !== undefined) coupon.usageLimit = input.usageLimit;
  if (input.perCustomerLimit !== undefined) coupon.perCustomerLimit = input.perCustomerLimit;
  if (input.isActive !== undefined) coupon.isActive = input.isActive;
  if (coupon.discountType === "PERCENTAGE" && Number(coupon.value) > 100) throw new AppError(400, "COUPON_PERCENT_INVALID", "Percentage cannot exceed 100.");
  if (coupon.startsAt && coupon.endsAt && coupon.startsAt >= coupon.endsAt) throw new AppError(400, "COUPON_DATE_RANGE_INVALID", "End date must be after start date.");
  if (coupon.usageLimit !== null && coupon.usageLimit < coupon.usedCount) throw new AppError(400, "COUPON_USAGE_LIMIT_INVALID", "Usage limit cannot be below the used count.");
  await repository.save(coupon);
  return response(coupon);
}

export async function deleteCoupon(id: string) {
  const repository = AppDataSource.getRepository(Coupon);
  const coupon = await repository.findOneBy({ id });
  if (!coupon) throw new AppError(404, "COUPON_NOT_FOUND", "Coupon not found.");
  await repository.softRemove(coupon);
}

export async function restoreCoupon(id: string) {
  const repository = AppDataSource.getRepository(Coupon);
  const coupon = await repository.findOne({ where: { id }, withDeleted: true });
  if (!coupon) throw new AppError(404, "COUPON_NOT_FOUND", "Coupon not found.");
  if (!coupon.deletedAt) throw new AppError(409, "COUPON_NOT_DELETED", "Coupon is not deleted.");
  await repository.restore(id); coupon.deletedAt = null; return response(coupon);
}

export function couponDiscount(coupon: Coupon, subtotal: bigint) {
  let discount = coupon.discountType === "FIXED"
    ? minor(coupon.value)
    : subtotal * BigInt(Math.round(Number(coupon.value) * 100)) / 10_000n;
  if (coupon.maximumDiscount !== null) discount = discount < minor(coupon.maximumDiscount) ? discount : minor(coupon.maximumDiscount);
  return discount < subtotal ? discount : subtotal;
}

export async function validateCoupon(
  manager: EntityManager,
  userId: string,
  rawCode: string,
  subtotal: bigint,
  lock = false,
) {
  const code = rawCode.trim().toUpperCase();
  let query = manager.getRepository(Coupon).createQueryBuilder("coupon").where("coupon.code = :code", { code });
  if (lock) query = query.setLock("pessimistic_write");
  const coupon = await query.getOne();
  if (!coupon || !coupon.isActive) throw new AppError(409, "COUPON_INVALID", "This coupon is invalid or inactive.");
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new AppError(409, "COUPON_NOT_STARTED", "This coupon is not active yet.");
  if (coupon.endsAt && coupon.endsAt < now) throw new AppError(409, "COUPON_EXPIRED", "This coupon has expired.");
  if (subtotal < minor(coupon.minimumSubtotal)) throw new AppError(409, "COUPON_MINIMUM_NOT_MET", `Spend at least BDT ${coupon.minimumSubtotal} to use this coupon.`);
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new AppError(409, "COUPON_LIMIT_REACHED", "This coupon has reached its usage limit.");
  const customerUses = await manager.getRepository(CouponRedemption).countBy({ couponId: coupon.id, userId });
  if (customerUses >= coupon.perCustomerLimit) throw new AppError(409, "COUPON_CUSTOMER_LIMIT_REACHED", "You have already used this coupon the maximum number of times.");
  return { coupon, discount: couponDiscount(coupon, subtotal) };
}
