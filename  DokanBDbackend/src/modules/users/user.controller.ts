import type { RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  adminUpdateUserSchema,
  updateProfileSchema,
  userListQuerySchema,
} from "./user.schema.js";
import {
  adminUpdateUser,
  getProfile,
  listUsers,
  setProfileImage,
  updateProfile,
} from "./user.service.js";

function authUserId(request: Parameters<RequestHandler>[0]) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }
  return request.auth.userId;
}

export const getMe: RequestHandler = async (request, response) => {
  response.status(200).json({
    success: true,
    data: { user: await getProfile(authUserId(request)) },
  });
};

export const updateMe: RequestHandler = async (request, response) => {
  response.status(200).json({
    success: true,
    data: {
      user: await updateProfile(
        authUserId(request),
        updateProfileSchema.parse(request.body),
      ),
    },
  });
};

export const uploadProfileImage: RequestHandler = async (request, response) => {
  if (!request.file) {
    throw new AppError(400, "IMAGE_REQUIRED", "Select an image to upload.");
  }

  response.status(200).json({
    success: true,
    data: {
      user: await setProfileImage(
        authUserId(request),
        `/uploads/profiles/${request.file.filename}`,
      ),
    },
  });
};

export const adminListUsers: RequestHandler = async (request, response) => {
  response.status(200).json({
    success: true,
    data: await listUsers(userListQuerySchema.parse(request.query)),
  });
};

export const adminUpdate: RequestHandler = async (request, response) => {
  const userId = request.params.userId;

  if (!userId || Array.isArray(userId)) {
    throw new AppError(400, "INVALID_USER_ID", "A valid user ID is required.");
  }

  response.status(200).json({
    success: true,
    data: {
      user: await adminUpdateUser(
        authUserId(request),
        userId,
        adminUpdateUserSchema.parse(request.body),
      ),
    },
  });
};
