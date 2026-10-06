import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IsNull, type EntityManager } from "typeorm";

import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppDataSource } from "../../database/data-source.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../services/mail.service.js";
import { AppError } from "../../utils/app-error.js";
import { Role } from "../role/role.entity.js";
import { User } from "../users/user.entity.js";
import { AuthToken, AuthTokenType } from "./auth-token.entity.js";
import {
  createOneTimeToken,
  findValidOneTimeToken,
  generateOpaqueToken,
  hashOpaqueToken,
} from "./auth-token.service.js";
import { RefreshSession } from "./refresh-session.entity.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.schema.js";

const PASSWORD_ROUNDS = 12;

interface SessionMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

function createAccessToken(userId: string, roleCode: string) {
  return jwt.sign({ role: roleCode }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    isActive: user.isActive,
    role: {
      id: user.role.id,
      code: user.role.code,
      name: user.role.name,
    },
    createdAt: user.createdAt,
  };
}

async function createRefreshSession(
  userId: string,
  metadata: SessionMetadata,
  manager: EntityManager = AppDataSource.manager,
) {
  const rawToken = generateOpaqueToken();
  const repository = manager.getRepository(RefreshSession);

  await repository.save(
    repository.create({
      userId,
      tokenHash: hashOpaqueToken(rawToken),
      expiresAt: new Date(
        Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
      revokedAt: null,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent?.slice(0, 500) ?? null,
    }),
  );

  return rawToken;
}

function verificationUrl(rawToken: string) {
  return `${env.WEB_ORIGIN}/verify-email?token=${rawToken}`;
}

function passwordResetUrl(rawToken: string) {
  return `${env.WEB_ORIGIN}/reset-password?token=${rawToken}`;
}

async function deliverVerificationEmail(user: User, rawToken: string) {
  if (!user.email || !env.SMTP_HOST || !env.MAIL_FROM) {
    return false;
  }

  try {
    await sendVerificationEmail({
      to: user.email,
      recipientName: user.name,
      actionUrl: verificationUrl(rawToken),
    });
    return true;
  } catch (error) {
    logger.error({ error, userId: user.id }, "Verification email delivery failed");
    return false;
  }
}

async function deliverPasswordResetEmail(user: User, rawToken: string) {
  if (!user.email || !env.SMTP_HOST || !env.MAIL_FROM) {
    return false;
  }

  try {
    await sendPasswordResetEmail({
      to: user.email,
      recipientName: user.name,
      actionUrl: passwordResetUrl(rawToken),
    });
    return true;
  } catch (error) {
    logger.error({ error, userId: user.id }, "Password-reset email delivery failed");
    return false;
  }
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

  if (await duplicateQuery.getOne()) {
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

  const user = userRepository.create({
    roleId: customerRole.id,
    name: input.name,
    email: input.email ?? null,
    emailVerifiedAt: null,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, PASSWORD_ROUNDS),
    profileImageUrl: null,
    isActive: true,
    lastLoginAt: null,
  });

  await userRepository.save(user);
  user.role = customerRole;

  let developmentVerificationToken: string | undefined;

  if (user.email) {
    const rawToken = await createOneTimeToken(
      user.id,
      AuthTokenType.EmailVerification,
      env.EMAIL_VERIFICATION_TTL_MINUTES,
    );
    const delivered = await deliverVerificationEmail(user, rawToken);

    if (env.NODE_ENV === "development" && !delivered) {
      developmentVerificationToken = rawToken;
    }
  }

  return {
    user: toPublicUser(user),
    ...(developmentVerificationToken
      ? { developmentVerificationToken }
      : {}),
  };
}

export async function loginUser(input: LoginInput, metadata: SessionMetadata) {
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

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.");
  }

  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_DISABLED", "This account is disabled.");
  }

  user.lastLoginAt = new Date();
  await userRepository.save(user);

  return {
    accessToken: createAccessToken(user.id, user.role.code),
    refreshToken: await createRefreshSession(user.id, metadata),
    tokenType: "Bearer",
    expiresIn: env.JWT_EXPIRES_IN,
    user: toPublicUser(user),
  };
}

export async function rotateRefreshToken(
  rawToken: string,
  metadata: SessionMetadata,
) {
  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(RefreshSession);
    const session = await repository.findOne({
      where: {
        tokenHash: hashOpaqueToken(rawToken),
        revokedAt: IsNull(),
      },
      relations: { user: { role: true } },
    });

    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user.isActive
    ) {
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "The refresh token is invalid or expired.",
      );
    }

    session.revokedAt = new Date();
    await repository.save(session);

    return {
      accessToken: createAccessToken(session.user.id, session.user.role.code),
      refreshToken: await createRefreshSession(
        session.user.id,
        metadata,
        manager,
      ),
      tokenType: "Bearer",
      expiresIn: env.JWT_EXPIRES_IN,
    };
  });
}

export async function revokeRefreshToken(rawToken: string) {
  await AppDataSource.getRepository(RefreshSession).update(
    { tokenHash: hashOpaqueToken(rawToken), revokedAt: IsNull() },
    { revokedAt: new Date() },
  );
}

export async function revokeAllRefreshTokens(userId: string) {
  await AppDataSource.getRepository(RefreshSession).update(
    { userId, revokedAt: IsNull() },
    { revokedAt: new Date() },
  );
}

export async function verifyEmail(input: VerifyEmailInput) {
  await AppDataSource.transaction(async (manager) => {
    const token = await findValidOneTimeToken(
      input.token,
      AuthTokenType.EmailVerification,
      manager,
    );

    if (!token.user.emailVerifiedAt) {
      token.user.emailVerifiedAt = new Date();
      await manager.getRepository(User).save(token.user);
    }

    token.usedAt = new Date();
    await manager.getRepository(AuthToken).save(token);
  });
}

export async function resendVerification(input: ResendVerificationInput) {
  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .where("LOWER(user.email) = :email", { email: input.email })
    .getOne();

  if (!user || !user.isActive || user.emailVerifiedAt) {
    return undefined;
  }

  const rawToken = await createOneTimeToken(
    user.id,
    AuthTokenType.EmailVerification,
    env.EMAIL_VERIFICATION_TTL_MINUTES,
  );
  const delivered = await deliverVerificationEmail(user, rawToken);

  return env.NODE_ENV === "development" && !delivered
    ? rawToken
    : undefined;
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .where("LOWER(user.email) = :email", { email: input.email })
    .getOne();

  if (!user || !user.isActive) {
    return undefined;
  }

  const rawToken = await createOneTimeToken(
    user.id,
    AuthTokenType.PasswordReset,
    env.PASSWORD_RESET_TTL_MINUTES,
  );
  const delivered = await deliverPasswordResetEmail(user, rawToken);

  return env.NODE_ENV === "development" && !delivered
    ? rawToken
    : undefined;
}

export async function resetPassword(input: ResetPasswordInput) {
  if (bcrypt.truncates(input.password)) {
    throw new AppError(400, "PASSWORD_TOO_LONG", "The password is too long.");
  }

  await AppDataSource.transaction(async (manager) => {
    const token = await findValidOneTimeToken(
      input.token,
      AuthTokenType.PasswordReset,
      manager,
    );
    const now = new Date();

    await manager.getRepository(User).update(token.userId, {
      passwordHash: await bcrypt.hash(input.password, PASSWORD_ROUNDS),
    });
    token.usedAt = now;
    await manager.getRepository(AuthToken).save(token);
    await manager.getRepository(RefreshSession).update(
      { userId: token.userId, revokedAt: IsNull() },
      { revokedAt: now },
    );
  });
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
