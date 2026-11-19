/**
 * HTTP security headers shared by the Express runtime (server.ts) and the
 * Cloudflare Worker runtime (worker/index.ts), so both deployment targets
 * present the identical security posture.
 *
 * The Content-Security-Policy is scoped to what this app actually needs,
 * verified against a production build with a real headless browser before
 * being enabled (see docs/ARCHITECTURE.md §10):
 *   - No inline <script>/<style> tags or eval()/new Function() anywhere in
 *     the app, so script-src can stay a strict 'self' with no unsafe-* needed.
 *   - style-src keeps 'unsafe-inline' only for Google Fonts' stylesheet link
 *     and React's/Three.js's script-driven element.style writes, which some
 *     browsers still gate behind it in edge cases; this does not weaken
 *     script-src, which is where CSP's real XSS-prevention value is.
 *   - connect-src is 'self' only: the Gemini API key and all AI calls stay
 *     server-side (see shared/aiStudio.ts) - the browser only ever calls
 *     this app's own /api/studio/* routes.
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export const HSTS_VALUE = 'max-age=31536000; includeSubDomains';

/** Headers applied unconditionally, in both dev and production, on every response. */
export const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self), midi=(self), usb=()',
};

/**
 * Headers applied only in production. CSP and HSTS are both left off in dev:
 * CSP because Vite's dev-mode HMR client needs a looser policy (inline
 * WebSocket reconnection scripts, eval-based fast refresh in some setups)
 * that would need separate, equally careful verification, and HSTS because
 * pinning a dev origin to HTTPS-only is actively harmful on localhost.
 */
export const PROD_ONLY_SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': HSTS_VALUE,
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
};
