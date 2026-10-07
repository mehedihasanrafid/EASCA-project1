import type { Request, RequestHandler } from "express";

import { AppError } from "../../utils/app-error.js";
import { addressIdParamsSchema, createAddressSchema, updateAddressSchema } from "./address.schema.js";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "./address.service.js";

function authenticatedUserId(request: Request) {
  if (!request.auth) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }

  return request.auth.userId;
}

export const list: RequestHandler = async (request, response) => {
  const addresses = await listAddresses(authenticatedUserId(request));

  response.status(200).json({ success: true, data: { addresses } });
};

export const create: RequestHandler = async (request, response) => {
  const input = createAddressSchema.parse(request.body);
  const address = await createAddress(authenticatedUserId(request), input);

  response.status(201).json({ success: true, data: { address } });
};

export const update: RequestHandler = async (request, response) => {
  const { addressId } = addressIdParamsSchema.parse(request.params);
  const input = updateAddressSchema.parse(request.body);
  const address = await updateAddress(authenticatedUserId(request), addressId, input);

  response.status(200).json({ success: true, data: { address } });
};

export const setDefault: RequestHandler = async (request, response) => {
  const { addressId } = addressIdParamsSchema.parse(request.params);
  const address = await setDefaultAddress(authenticatedUserId(request), addressId);

  response.status(200).json({ success: true, data: { address } });
};

export const remove: RequestHandler = async (request, response) => {
  const { addressId } = addressIdParamsSchema.parse(request.params);
  await deleteAddress(authenticatedUserId(request), addressId);

  response.status(204).send();
};
