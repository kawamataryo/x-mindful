import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-medium focus-ring rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-gradient text-white shadow-sm hover:shadow-md",
  secondary:
    "bg-white border border-slate-200 text-content hover:border-slate-300 hover:bg-slate-50 transition-all duration-150",
  quiet:
    "bg-transparent text-content-secondary hover:text-content hover:bg-slate-100 transition-all duration-150",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-sm transition-colors duration-150",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
