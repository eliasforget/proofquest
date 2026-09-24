export type ProfileInput = { headline: string; bio: string; public_links: string[] };

export function safePublicLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300 || /[\s\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password || url.href.length > 300) return null;
    return url.href;
  } catch { return null; }
}

export function parseProfileInput(value: unknown): ProfileInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.headline !== "string" || typeof input.bio !== "string" || !Array.isArray(input.public_links)) return null;
  const headline = input.headline.trim();
  const bio = input.bio.trim();
  if (headline.length > 80 || bio.length > 500 || input.public_links.length > 3) return null;
  const links = input.public_links.map(safePublicLink);
  if (links.some((link) => !link)) return null;
  return { headline, bio, public_links: [...new Set(links as string[])] };
}
