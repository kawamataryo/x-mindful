import type { ReactNode, HTMLAttributes } from "react";

type SurfaceVariant = "card" | "inset" | "elevated";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  children: ReactNode;
}

const variantClasses: Record<SurfaceVariant, string> = {
  card: "bg-white border border-paper-3 rounded-lg shadow-sm",
  inset: "bg-paper-2 border border-paper-3 rounded-lg",
  elevated: "bg-white border border-paper-3 rounded-xl shadow-md",
};

export function Surface({
  variant = "card",
  className = "",
  children,
  ...props
}: SurfaceProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
