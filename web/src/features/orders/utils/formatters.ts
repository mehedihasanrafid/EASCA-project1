export const orderPriceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

export const orderDateFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatOrderPrice(value: string | number) {
  return orderPriceFormatter.format(Number(value));
}

export function formatOrderDate(value: string | Date) {
  return orderDateFormatter.format(new Date(value));
}
