import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppDataSource } from "../../database/data-source.js";
import { Role } from "../role/role.entity.js";
import { User } from "../users/user.entity.js";
import { AppError } from "../../utils/app-error.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const PASSWORD_ROUNDS = 12;

function createAccessToken(userId: string, roleCode: string) {
  return jwt.sign(
    { role: roleCode },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: userId,
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    role: {
      id: user.role.id,
      code: user.role.code,
      name: user.role.name,
    },
    createdAt: user.createdAt,
  };
}

export async function registerUser(input: RegisterInput) {
  const userRepository = AppDataSource.getRepository(User);
  const roleRepository = AppDataSource.getRepository(Role);

  const duplicateQuery = userRepository
    .createQueryBuilder("user")
    .withDeleted()
    .where("user.phone = :phone", { phone: input.phone });

  if (input.email) {
    duplicateQuery.orWhere("LOWER(user.email) = :email", {
      email: input.email,
    });
  }

  const existingUser = await duplicateQuery.getOne();

  if (existingUser) {
    throw new AppError(
      409,
      "USER_ALREADY_EXISTS",
      "A user with this phone or email already exists.",
    );
  }

  const customerRole = await roleRepository.findOneBy({ code: "CUSTOMER" });

  if (!customerRole) {
    throw new AppError(
      500,
      "CUSTOMER_ROLE_MISSING",
      "The CUSTOMER role has not been seeded.",
    );
  }

  if (bcrypt.truncates(input.password)) {
    throw new AppError(400, "PASSWORD_TOO_LONG", "The password is too long.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);

  const user = userRepository.create({
    roleId: customerRole.id,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone,
    passwordHash,
    profileImageUrl: null,
    isActive: true,
    lastLoginAt: null,
  });

  await userRepository.save(user);
  user.role = customerRole;

  return toPublicUser(user);
}

export async function loginUser(input: LoginInput) {
  const userRepository = AppDataSource.getRepository(User);
  const identifier = input.identifier.toLowerCase();

  const query = userRepository
    .createQueryBuilder("user")
    .addSelect("user.passwordHash")
    .leftJoinAndSelect("user.role", "role");

  if (identifier.includes("@")) {
    query.where("LOWER(user.email) = :identifier", { identifier });
  } else {
    query.where("user.phone = :identifier", { identifier });
  }

  const user = await query.getOne();

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.");
  }

  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_DISABLED", "This account is disabled.");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.");
  }

  user.lastLoginAt = new Date();
  await userRepository.save(user);

  return {
    accessToken: createAccessToken(user.id, user.role.code),
    tokenType: "Bearer",
    expiresIn: env.JWT_EXPIRES_IN,
    user: toPublicUser(user),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    relations: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  return toPublicUser(user);
}

/*The entity hides passwordHash with select: false.
Login explicitly selects the hash for password comparison.
Responses never include the password or hash.
Both unknown users and wrong passwords return the same message.*/