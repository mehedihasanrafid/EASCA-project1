import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import {
  cancelOrderSchema,
  checkoutSchema,
  customerOrderListQuerySchema,
  orderIdParamsSchema,
} from "./order.schema.js";
import {
  cancelCustomerOrder,
  checkout,
  getCustomerOrder,
  listCustomerOrders,
} from "./order.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const checkoutCart: RequestHandler = async (request, response) => {
  const input = checkoutSchema.parse(request.body);
  const order = await checkout(authenticatedUserId(request), input);

  response.status(201).json({ success: true, data: { order } });
};

export const listOwnOrders: RequestHandler = async (request, response) => {
  const filters = customerOrderListQuerySchema.parse(request.query);
  const result = await listCustomerOrders(authenticatedUserId(request), filters);

  response.status(200).json({ success: true, data: result });
};

export const getOwnOrder: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const order = await getCustomerOrder(authenticatedUserId(request), orderId);

  response.status(200).json({ success: true, data: { order } });
};

export const cancelOwnOrder: RequestHandler = async (request, response) => {
  const { orderId } = orderIdParamsSchema.parse(request.params);
  const input = cancelOrderSchema.parse(request.body ?? {});
  const order = await cancelCustomerOrder(
    authenticatedUserId(request),
    orderId,
    input,
  );

  response.status(200).json({ success: true, data: { order } });
};
