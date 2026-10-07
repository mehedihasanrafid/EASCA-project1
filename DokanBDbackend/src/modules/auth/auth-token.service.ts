import { IsNull, type EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "../../utils/opaque-token.js";
import { AuthToken, AuthTokenType } from "./auth-token.entity.js";

export { generateOpaqueToken, hashOpaqueToken } from "../../utils/opaque-token.js";

export async function createOneTimeToken(
  userId: string,
  type: AuthTokenType,
  ttlMinutes: number,
  manager: EntityManager = AppDataSource.manager,
) {
  const repository = manager.getRepository(AuthToken);

  await repository.update(
    { userId, type, usedAt: IsNull() },
    { usedAt: new Date() },
  );

  const rawToken = generateOpaqueToken();
  const token = repository.create({
    userId,
    type,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    usedAt: null,
  });

  await repository.save(token);
  return rawToken;
}

export async function findValidOneTimeToken(
  rawToken: string,
  type: AuthTokenType,
  manager: EntityManager = AppDataSource.manager,
) {
  const token = await manager.getRepository(AuthToken).findOne({
    where: {
      tokenHash: hashOpaqueToken(rawToken),
      type,
      usedAt: IsNull(),
    },
    relations: { user: { role: true } },
  });

  if (!token || token.expiresAt.getTime() <= Date.now()) {
    throw new AppError(
      400,
      "INVALID_OR_EXPIRED_TOKEN",
      "The token is invalid or expired.",
    );
  }

  return token;
}
