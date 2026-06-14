export const clamp = (value: number, min = 0, max = 100) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
};

export const safeDivide = (numerator: number, denominator: number, fallback = 0) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }

  return numerator / denominator;
};

export const percentage = (numerator: number, denominator: number) =>
  safeDivide(numerator, denominator) * 100;

export const percentageDrop = (current: number, previous: number) => {
  if (current >= previous) {
    return 0;
  }

  return percentage(previous - current, previous);
};

export const percentageGrowth = (current: number, previous: number) => {
  if (current <= previous) {
    return 0;
  }

  return percentage(current - previous, previous);
};

export const round = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
