import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { Address, AddressInput, addressApi } from "./addresses";

const address = { id: "3" } as Address;
const input = {
  recipientName: "Mehedi Hasan",
  phone: "01700000001",
  addressLine1: "House 10, Road 5",
  area: "Dhanmondi",
  city: "Dhaka",
  district: "Dhaka",
  division: "Dhaka",
  country: "Bangladesh",
  isInsideDhaka: true,
} satisfies AddressInput;

describe("addressApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("lists addresses", async () => {
    apiClient.mockResolvedValue({ addresses: [address] });
    await expect(addressApi.list()).resolves.toEqual([address]);
    expect(apiClient).toHaveBeenCalledWith("/addresses", { method: "GET" });
  });

  it("creates and updates an address", async () => {
    apiClient.mockResolvedValue({ address });
    await addressApi.create(input);
    expect(apiClient).toHaveBeenLastCalledWith("/addresses", {
      method: "POST",
      body: JSON.stringify(input),
    });

    await addressApi.update("3", input);
    expect(apiClient).toHaveBeenLastCalledWith("/addresses/3", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  });

  it("sets a default and removes an address", async () => {
    apiClient.mockResolvedValueOnce({ address }).mockResolvedValueOnce(undefined);
    await addressApi.setDefault("3");
    expect(apiClient).toHaveBeenLastCalledWith("/addresses/3/default", {
      method: "PATCH",
    });

    await addressApi.remove("3");
    expect(apiClient).toHaveBeenLastCalledWith("/addresses/3", {
      method: "DELETE",
    });
  });
});
