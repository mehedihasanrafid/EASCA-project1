import { Router } from "express";

import { listBrands } from "./brand.controller.js";

export const brandRouter = Router();

brandRouter.get("/", listBrands);
