import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { create, list, remove, setDefault, update } from "./address.controller.js";

export const addressRouter = Router();

addressRouter.use(requireAuth);
addressRouter.get("/", list);
addressRouter.post("/", create);
addressRouter.patch("/:addressId/default", setDefault);
addressRouter.patch("/:addressId", update);
addressRouter.delete("/:addressId", remove);
