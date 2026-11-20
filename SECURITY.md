# Security Policy

## Ownership & Authority

**SwaraKala Studio** is maintained under the sole codeownership of **Aditya Rachuri (`@adityarachuri`)**. All security reviews, secret rotations, and production deployments require explicit approval from `@adityarachuri`.

---

## Supported Versions

| Version | Supported | Runtime |
| --- | --- | --- |
| `1.x` | Yes | Cloudflare Workers (`worker/index.ts`) + Node/Express (`server.ts`) |

---

## Security Architecture Controls

- **Zero Client-Side Secret Exposure**: Upstream synthesis API credentials (`GEMINI_API_KEY`) are injected strictly via server environment secrets or Cloudflare Workers encrypted secrets (`wrangler secret put GEMINI_API_KEY`). Client bundles are verified secret-free in CI.
- **Strict Input Validation & Resource Bounds**: All `/api/studio/*` routes enforce JSON body size limits (`256 KB` for composition payloads; `10 MB` for base64 audio clips), MIME allowlists, numeric clamping against `NaN`/`Infinity`, and sanitized text length limits.
- **Hardened HTTP Response Headers**: Responses enforce `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Permitted-Cross-Domain-Policies: none`, `Permissions-Policy` scoped to `(self)` for microphone and Web MIDI only, and `Strict-Transport-Security` in production.
- **Safe Client State Hydration**: Imported session `.json` files and persisted Web MIDI mappings are schema-validated against allowlisted target keys and finite bounds before entering React state.
- **Automated DevSecOps Gates**: Every pull request runs GitHub CodeQL SAST analysis, secret pattern scanning, dependency vulnerability auditing (`npm audit`), strict TypeScript checking, and SBOM generation.

---

## Reporting a Vulnerability

Please report security issues privately and directly to the permanent codeowner, **@adityarachuri**, using GitHub's private vulnerability reporting:

- Open a report via the **Security** tab → **Report a vulnerability** on this repository, or visit `https://github.com/adityarachuri/swarakala-studio/security/advisories/new`.

Please do **not** open public GitHub issues for undisclosed vulnerabilities. You will receive an acknowledgment within 48 hours.
