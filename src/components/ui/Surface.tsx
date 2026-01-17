import type { ReactNode, HTMLAttributes } from "react";

type SurfaceVariant = "card" | "inset" | "elevated";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  children: ReactNode;
}

const variantClasses: Record<SurfaceVariant, string> = {
  card: "bg-white border border-base-muted rounded-md shadow-sm hover-lift",
  inset: "bg-base-subtle border border-base-muted rounded-md",
  elevated: "bg-white border border-base-muted rounded-lg shadow-md hover-lift",
};

export function Surface({ variant = "card", className = "", children, ...props }: SurfaceProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
