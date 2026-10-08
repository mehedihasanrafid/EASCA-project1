export const productPriceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});

export function formatProductPrice(value: string | number) {
  return productPriceFormatter.format(Number(value));
}
