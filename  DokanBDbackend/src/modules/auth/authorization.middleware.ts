import type { RequestHandler } from "express";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { User } from "../users/user.entity.js";

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(
        new AppError(
          401,
          "AUTHENTICATION_REQUIRED",
          "Authentication is required.",
        ),
      );
      return;
    }

    if (!allowedRoles.includes(request.auth.roleCode)) {
      next(new AppError(403, "FORBIDDEN", "You cannot perform this action."));
      return;
    }

    next();
  };
}

export const requireVerifiedEmail: RequestHandler = async (
  request,
  _response,
  next,
) => {
  if (!request.auth) {
    next(
      new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required."),
    );
    return;
  }

  const user = await AppDataSource.getRepository(User).findOneBy({
    id: request.auth.userId,
  });

  if (!user?.email || !user.emailVerifiedAt) {
    next(
      new AppError(
        403,
        "EMAIL_VERIFICATION_REQUIRED",
        "Please verify your email before continuing.",
      ),
    );
    return;
  }

  next();
};
