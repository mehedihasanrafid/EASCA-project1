import type { EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { User } from "../users/user.entity.js";
import { Address } from "./address.entity.js";
import type { CreateAddressInput, UpdateAddressInput } from "./address.schema.js";

function toPublicAddress(address: Address) {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    area: address.area,
    city: address.city,
    district: address.district,
    division: address.division,
    postalCode: address.postalCode,
    country: address.country,
    isInsideDhaka: address.isInsideDhaka,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
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

async function findOwnedAddress(
  manager: EntityManager,
  userId: string,
  addressId: string,
) {
  const address = await manager.getRepository(Address).findOneBy({
    id: addressId,
    userId,
  });

  if (!address) {
    throw new AppError(404, "ADDRESS_NOT_FOUND", "Address not found.");
  }

  return address;
}

async function clearCurrentDefault(manager: EntityManager, userId: string) {
  await manager.getRepository(Address).update(
    { userId, isDefault: true },
    { isDefault: false },
  );
}

export async function listAddresses(userId: string) {
  const addresses = await AppDataSource.getRepository(Address).find({
    where: { userId },
    order: { isDefault: "DESC", createdAt: "DESC" },
  });

  return addresses.map(toPublicAddress);
}

export async function createAddress(userId: string, input: CreateAddressInput) {
  return AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const activeAddressCount = await addressRepository.countBy({ userId });
    const shouldBeDefault = input.isDefault || activeAddressCount === 0;

    if (shouldBeDefault) {
      await clearCurrentDefault(manager, userId);
    }

    const address = addressRepository.create({
      userId,
      label: input.label ?? null,
      recipientName: input.recipientName,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      area: input.area,
      city: input.city,
      district: input.district,
      division: input.division,
      postalCode: input.postalCode ?? null,
      country: input.country,
      isInsideDhaka: input.isInsideDhaka,
      isDefault: shouldBeDefault,
    });

    await addressRepository.save(address);
    return toPublicAddress(address);
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
) {
  return AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const address = await findOwnedAddress(manager, userId, addressId);

    addressRepository.merge(address, input);
    await addressRepository.save(address);

    return toPublicAddress(address);
  });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  return AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const address = await findOwnedAddress(manager, userId, addressId);

    await clearCurrentDefault(manager, userId);
    address.isDefault = true;
    await addressRepository.save(address);

    return toPublicAddress(address);
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  await AppDataSource.transaction(async (manager) => {
    await lockUser(manager, userId);

    const addressRepository = manager.getRepository(Address);
    const address = await findOwnedAddress(manager, userId, addressId);
    const wasDefault = address.isDefault;

    await addressRepository.softRemove(address);

    if (wasDefault) {
      const replacement = await addressRepository.findOne({
        where: { userId },
        order: { createdAt: "DESC" },
      });

      if (replacement) {
        replacement.isDefault = true;
        await addressRepository.save(replacement);
      }
    }
  });
}
