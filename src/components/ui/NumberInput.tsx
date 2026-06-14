import type { InputHTMLAttributes } from "react";
import { Input } from "./Input";
import { formatCurrency } from "../../domain/formatters";

type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  label: string;
  value: number;
  hint?: string;
  error?: string;
  format?: "number" | "currency";
  onValueChange: (value: number) => void;
};

const parseCurrencyInput = (input: string) => {
  const cents = input.replace(/\D/g, "");

  return cents ? Number(cents) / 100 : 0;
};

export const NumberInput = ({ value, onValueChange, format = "number", ...props }: NumberInputProps) => {
  if (format === "currency") {
    return (
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        value={formatCurrency(value)}
        onChange={(event) => onValueChange(parseCurrencyInput(event.target.value))}
      />
    );
  }

  return (
    <Input
      {...props}
      type="number"
      min={props.min ?? 0}
      step={props.step ?? "0.01"}
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onValueChange(Number(event.target.value))}
    />
  );
};
