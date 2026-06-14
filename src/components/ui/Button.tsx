import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: ReactNode;
};

export const Button = ({
  className,
  variant = "secondary",
  size = "md",
  icon,
  children,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={clsx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)}
    {...props}
  >
    {icon ? <span className="ui-button-icon">{icon}</span> : null}
    {children}
  </button>
);
