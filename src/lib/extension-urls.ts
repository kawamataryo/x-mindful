export function buildOptionsUrl(params?: URLSearchParams): string {
  const query = params?.toString();
  return chrome.runtime.getURL(query ? `options.html?${query}` : "options.html");
}

export function buildStartSessionUrl(siteId: string, returnUrl?: string): string {
  const params = new URLSearchParams();
  params.set("view", "start-session");
  params.set("siteId", siteId);
  if (returnUrl) {
    params.set("returnUrl", returnUrl);
  }
  return buildOptionsUrl(params);
}

export function buildReflectionUrl(): string {
  const params = new URLSearchParams();
  params.set("view", "reflection");
  return buildOptionsUrl(params);
}
