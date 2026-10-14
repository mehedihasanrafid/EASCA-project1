/** Convert the administrator's comma-separated input into clean, unique values. */
export function parseAttributeValues(input: string) {
  const seen = new Set<string>();

  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => {
      if (!value) return false;
      const key = value.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
