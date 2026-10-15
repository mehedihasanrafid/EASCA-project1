
import { describe, expect, it } from "vitest";
import { ApiException } from "../../api/client";
import { getApiErrorMessage } from "./apiError";

describe("getApiErrorMessage", () => {
  it("extracts backend API error messages", () => {
    const error = new ApiException(400, {
      code: "INVALID_INPUT",
      message: "Invalid product information",
    });

    expect(getApiErrorMessage(error, "Something went wrong"))
      .toBe("Invalid product information");
  });

  it("handles standard JavaScript errors", () => {
    const error = new Error("Network connection failed");

    expect(getApiErrorMessage(error, "Something went wrong"))
      .toBe("Network connection failed");
  });

  it("uses fallback for unknown errors", () => {
    expect(getApiErrorMessage(null, "Request failed"))
      .toBe("Request failed");
  });

  it("uses fallback for thrown strings", () => {
    expect(getApiErrorMessage("Unexpected", "Please try again"))
      .toBe("Please try again");
  });
});
