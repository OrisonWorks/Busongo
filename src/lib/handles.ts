export const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const RESERVED = new Set(["admin", "api", "busongo", "support", "help", "about", "contact", "login", "register", "roadmap", "verify", "settings", "profile", "official", "luse", "boz", "sec", "grz"]);

export const normalizeHandle = (h: string) => h.trim().toLowerCase().replace(/^@/, "");
export const handleLabel = (h: string) => `@${h}`;
export const profilePath = (h: string) => `/@${h}`;

/** Returns an error message, or null when `h` (already normalised) is a valid, unreserved handle. */
export function handleError(h: string) {
  if (!HANDLE_RE.test(h)) return "Handles are 3–30 characters: lowercase letters, numbers and hyphens, not starting or ending with a hyphen";
  if (RESERVED.has(h)) return "That handle is reserved";
  return null;
}
