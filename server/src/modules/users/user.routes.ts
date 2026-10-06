import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import {
  adminListUsers,
  adminUpdate,
  getMe,
  updateMe,
  uploadProfileImage,
} from "./user.controller.js";
import { profileImageUpload } from "./user-upload.middleware.js";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/me", getMe);
userRouter.patch("/me", updateMe);
userRouter.post(
  "/me/profile-image",
  profileImageUpload.single("image"),
  uploadProfileImage,
);
userRouter.get("/", requireRole("ADMIN", "OWNER"), adminListUsers);
userRouter.patch(
  "/:userId",
  requireRole("ADMIN", "OWNER"),
  adminUpdate,
);
