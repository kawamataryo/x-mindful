import type { ReactNode, HTMLAttributes } from "react";

type SurfaceVariant = "card" | "inset" | "elevated";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  children: ReactNode;
}

const variantClasses: Record<SurfaceVariant, string> = {
  card: "glass rounded-lg hover-lift",
  inset: "bg-white/50 backdrop-blur-sm border border-[rgba(139,92,246,0.12)] rounded-lg transition-all duration-150",
  elevated: "glass rounded-xl shadow-lg hover-lift",
};

export function Surface({ variant = "card", className = "", children, ...props }: SurfaceProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
