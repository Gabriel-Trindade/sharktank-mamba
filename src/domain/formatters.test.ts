import { describe, expect, it } from "vitest";
import { formatCurrency, formatDecimal, formatInteger, formatPercent } from "./formatters";

describe("formatters", () => {
  it("formats currency, percentage, integer and decimal values", () => {
    expect(formatCurrency(1234.5)).toContain("1.234,50");
    expect(formatPercent(12.345)).toBe("12,35%");
    expect(formatInteger(1200.4)).toBe("1.200");
    expect(formatDecimal(3.456)).toBe("3,46");
  });

  it("uses neutral values for invalid numbers", () => {
    expect(formatCurrency(Number.NaN)).toContain("0,00");
    expect(formatPercent(Number.NaN)).toBe("0,0%");
  });
});
