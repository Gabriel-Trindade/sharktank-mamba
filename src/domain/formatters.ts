const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number) => brlFormatter.format(Number.isFinite(value) ? value : 0);

export const formatInteger = (value: number) =>
  integerFormatter.format(Math.round(Number.isFinite(value) ? value : 0));

export const formatDecimal = (value: number) => decimalFormatter.format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value: number) => `${formatDecimal(value)}%`;
