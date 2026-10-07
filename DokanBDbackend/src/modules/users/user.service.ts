import { Brackets } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { Role } from "../role/role.entity.js";
import { User } from "./user.entity.js";
import type {
  AdminUpdateUserInput,
  UpdateProfileInput,
  UserListQuery,
} from "./user.schema.js";

function publicProfile(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    isActive: user.isActive,
    role: user.role
      ? { id: user.role.id, code: user.role.code, name: user.role.name }
      : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findActiveUser(userId: string) {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    relations: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  return user;
}

export async function getProfile(userId: string) {
  return publicProfile(await findActiveUser(userId));
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const repository = AppDataSource.getRepository(User);
  const user = await findActiveUser(userId);

  if (input.phone && input.phone !== user.phone) {
    const duplicate = await repository
      .createQueryBuilder("user")
      .withDeleted()
      .where("user.phone = :phone", { phone: input.phone })
      .andWhere("user.id <> :userId", { userId })
      .getOne();

    if (duplicate) {
      throw new AppError(409, "PHONE_ALREADY_USED", "The phone number is already used.");
    }
  }

  repository.merge(user, input);
  await repository.save(user);
  return publicProfile(user);
}

export async function setProfileImage(userId: string, imageUrl: string) {
  const repository = AppDataSource.getRepository(User);
  const user = await findActiveUser(userId);
  user.profileImageUrl = imageUrl;
  await repository.save(user);
  return publicProfile(user);
}

export async function listUsers(query: UserListQuery) {
  const repository = AppDataSource.getRepository(User);
  const builder = repository
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .orderBy("user.createdAt", "DESC")
    .skip((query.page - 1) * query.limit)
    .take(query.limit);

  if (query.search) {
    builder.andWhere(
      new Brackets((where) => {
        where
          .where("LOWER(user.name) LIKE :search", {
            search: `%${query.search!.toLowerCase()}%`,
          })
          .orWhere("LOWER(user.email) LIKE :search", {
            search: `%${query.search!.toLowerCase()}%`,
          })
          .orWhere("user.phone LIKE :search", { search: `%${query.search}%` });
      }),
    );
  }

  if (query.role) {
    builder.andWhere("role.code = :role", { role: query.role });
  }

  if (query.isActive !== undefined) {
    builder.andWhere("user.isActive = :isActive", { isActive: query.isActive });
  }

  const [users, total] = await builder.getManyAndCount();
  return {
    users: users.map(publicProfile),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function adminUpdateUser(
  actorUserId: string,
  userId: string,
  input: AdminUpdateUserInput,
) {
  if (actorUserId === userId && input.isActive === false) {
    throw new AppError(400, "CANNOT_DISABLE_SELF", "You cannot disable your own account.");
  }

  const repository = AppDataSource.getRepository(User);
  const user = await repository.findOne({
    where: { id: userId },
    relations: { role: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  if (input.roleCode) {
    const role = await AppDataSource.getRepository(Role).findOneBy({
      code: input.roleCode,
    });
    if (!role) {
      throw new AppError(400, "ROLE_NOT_FOUND", "Role not found.");
    }
    user.role = role;
    user.roleId = role.id;
  }

  if (input.isActive !== undefined) {
    user.isActive = input.isActive;
  }

  await repository.save(user);
  return publicProfile(user);
}
