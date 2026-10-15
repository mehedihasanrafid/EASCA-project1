
/**
 * Builds query strings for API filters, sorting and pagination.
 * Skips null, undefined and empty strings.
 * Keeps 0 and false because they are valid filter values.
 */
export function buildQueryParams<T extends object>(params: T): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.append(key, String(value));
  }

  return query.toString();
}
