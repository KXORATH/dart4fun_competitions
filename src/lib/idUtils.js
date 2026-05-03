/**
 * Custom ID generator that doesn't rely on Web Crypto API (crypto.getRandomValues),
 * which is often unavailable in non-secure contexts (HTTP) or older TV browsers.
 */
export function generateId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}
