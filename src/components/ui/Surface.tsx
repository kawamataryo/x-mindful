import type { ReactNode, HTMLAttributes } from "react";

type SurfaceVariant = "card" | "inset" | "elevated";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  children: ReactNode;
}

const variantClasses: Record<SurfaceVariant, string> = {
  card: "glass rounded-lg",
  inset: "bg-white rounded-lg border border-slate-200/80 shadow-sm transition-all duration-150",
  elevated: "glass rounded-xl shadow-md",
};

export function Surface({ variant = "card", className = "", children, ...props }: SurfaceProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
