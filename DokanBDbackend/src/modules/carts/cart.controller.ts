import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { addCartItemSchema, cartItemIdParamsSchema, updateCartItemSchema } from "./cart.schema.js";
import {
  addCartItem,
  clearCart,
  getActiveCart,
  removeCartItem,
  updateCartItem,
} from "./cart.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const get: RequestHandler = async (request, response) => {
  const cart = await getActiveCart(authenticatedUserId(request));

  response.status(200).json({ success: true, data: { cart } });
};

export const addItem: RequestHandler = async (request, response) => {
  const input = addCartItemSchema.parse(request.body);
  const cart = await addCartItem(authenticatedUserId(request), input);

  response.status(200).json({ success: true, data: { cart } });
};

export const updateItem: RequestHandler = async (request, response) => {
  const { itemId } = cartItemIdParamsSchema.parse(request.params);
  const input = updateCartItemSchema.parse(request.body);
  const cart = await updateCartItem(authenticatedUserId(request), itemId, input);

  response.status(200).json({ success: true, data: { cart } });
};

export const removeItem: RequestHandler = async (request, response) => {
  const { itemId } = cartItemIdParamsSchema.parse(request.params);
  const cart = await removeCartItem(authenticatedUserId(request), itemId);

  response.status(200).json({ success: true, data: { cart } });
};

export const clear: RequestHandler = async (request, response) => {
  const cart = await clearCart(authenticatedUserId(request));

  response.status(200).json({ success: true, data: { cart } });
};
