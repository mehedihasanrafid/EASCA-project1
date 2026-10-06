import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { addItem, clear, get, removeItem, updateItem } from "./cart.controller.js";

export const cartRouter = Router();

cartRouter.use(requireAuth);
cartRouter.get("/", get);
cartRouter.post("/items", addItem);
cartRouter.patch("/items/:itemId", updateItem);
cartRouter.delete("/items", clear);
cartRouter.delete("/items/:itemId", removeItem);
