
/**
 * Shared BDT currency formatter.
 * Use formatBdt() wherever prices are displayed.
 * Change locale/currency settings here, not in individual components.
 */
const bdtFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

export function formatBdt(value: string | number): string {
  return bdtFormatter.format(Number(value));
}
