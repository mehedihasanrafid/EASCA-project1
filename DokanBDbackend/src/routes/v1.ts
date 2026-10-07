import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { addressRouter } from "../modules/addresses/address.routes.js";
import { cartRouter } from "../modules/carts/cart.routes.js";
import {
  adminCategoryRouter,
  categoryRouter,
} from "../modules/categories/category.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { adminOrderRouter } from "../modules/orders/order-admin.routes.js";
import { orderRouter } from "../modules/orders/order.routes.js";
import {
  adminProductRouter,
  productRouter,
} from "../modules/products/product.routes.js";
import { userRouter } from "../modules/users/user.routes.js";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/addresses", addressRouter);
v1Router.use("/cart", cartRouter);
v1Router.use("/users", userRouter);
v1Router.use("/categories", categoryRouter);
v1Router.use("/products", productRouter);
v1Router.use("/admin/categories", adminCategoryRouter);
v1Router.use("/admin/products", adminProductRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/admin/orders", adminOrderRouter);
