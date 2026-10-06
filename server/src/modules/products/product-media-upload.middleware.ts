import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import multer from "multer";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const productDirectory = resolve(env.UPLOAD_DIR, "products");
mkdirSync(productDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: productDirectory,
    filename(_request, file, callback) {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 4 },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(
          400,
          "INVALID_IMAGE_TYPE",
          "Only JPEG, PNG and WebP images are allowed.",
        ),
      );
      return;
    }
    callback(null, true);
  },
});
