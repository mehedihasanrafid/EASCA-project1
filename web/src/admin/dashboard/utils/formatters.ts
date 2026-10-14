const moneyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("en-BD");

const updatedFormatter = new Intl.DateTimeFormat("en-BD", {
  hour: "numeric",
  minute: "2-digit",
});

export const formatMoney = (value: string | number) => moneyFormatter.format(Number(value));
export const formatInteger = (value: number) => integerFormatter.format(value);
export const formatUpdatedTime = (value: string) => updatedFormatter.format(new Date(value));
