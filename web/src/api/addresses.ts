import { apiClient } from "./client";

export interface Address {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  area: string;
  city: string;
  district: string;
  division: string;
  postalCode: string | null;
  country: string;
  isInsideDhaka: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  label?: string | null;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  area: string;
  city: string;
  district: string;
  division: string;
  postalCode?: string | null;
  country: string;
  isInsideDhaka: boolean;
  isDefault?: boolean;
}

export const addressApi = {
  list: () =>
    apiClient<{ addresses: Address[] }>("/addresses", { method: "GET" }).then(
      ({ addresses }) => addresses,
    ),

  create: (input: AddressInput) =>
    apiClient<{ address: Address }>("/addresses", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ address }) => address),

  update: (addressId: string, input: AddressInput) =>
    apiClient<{ address: Address }>(`/addresses/${encodeURIComponent(addressId)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ address }) => address),

  setDefault: (addressId: string) =>
    apiClient<{ address: Address }>(
      `/addresses/${encodeURIComponent(addressId)}/default`,
      { method: "PATCH" },
    ).then(({ address }) => address),

  remove: (addressId: string) =>
    apiClient<void>(`/addresses/${encodeURIComponent(addressId)}`, {
      method: "DELETE",
    }),
};
