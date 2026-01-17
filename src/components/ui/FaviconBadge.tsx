interface FaviconBadgeProps {
  siteUrl?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4 text-[10px]",
  md: "w-6 h-6 text-xs",
  lg: "w-8 h-8 text-sm",
} as const;

function getFaviconUrl(siteUrl?: string): string | null {
  if (!siteUrl) return null;
  try {
    const host = new URL(siteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

export function FaviconBadge({ siteUrl, label, size = "sm", className = "" }: FaviconBadgeProps) {
  const faviconUrl = getFaviconUrl(siteUrl);
  const fallbackChar = (label || siteUrl || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-sm bg-paper-2 overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {faviconUrl ? (
        <img src={faviconUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span className="text-ink-muted font-medium">{fallbackChar}</span>
      )}
    </div>
  );
}
