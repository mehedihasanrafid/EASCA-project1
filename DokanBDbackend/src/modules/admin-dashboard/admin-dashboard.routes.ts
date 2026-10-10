import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/authorization.middleware.js";
import { showAdminDashboard } from "./admin-dashboard.controller.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAuth, requireRole("ADMIN", "OWNER"));
adminDashboardRouter.get("/", showAdminDashboard);
