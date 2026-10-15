
import { ApiException } from "../../api/client";

/** Extract a user-friendly message from an API or JavaScript error. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiException) {
    return error.error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
