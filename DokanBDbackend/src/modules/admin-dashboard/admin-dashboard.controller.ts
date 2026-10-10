import type { RequestHandler } from "express";

import { getAdminDashboard } from "./admin-dashboard.service.js";

export const showAdminDashboard: RequestHandler = async (_request, response) => {
  const dashboard = await getAdminDashboard();
  response.status(200).json({ success: true, data: { dashboard } });
};
