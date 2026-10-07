import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  adminOrderListQuerySchema,
  adminOrderStatusSchema,
  orderIdParamsSchema,
} from "./order.schema.js";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from "./order.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const listOrdersForAdmin: RequestHandler = async (request, response) => {
  const filters = adminOrderListQuerySchema.parse(request.query);
  const result = await listAdminOrders(filters);

  response.status(200).json({ success: true, data: result });
};

export const getOrderForAdmin: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const order = await getAdminOrder(orderId);

  response.status(200).json({ success: true, data: { order } });
};

export const changeOrderStatus: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const input = adminOrderStatusSchema.parse(request.body);
  const order = await updateAdminOrderStatus(
    authenticatedUserId(request),
    orderId,
    input,
  );

  response.status(200).json({ success: true, data: { order } });
};
