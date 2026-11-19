# Changelog

All notable releases of **SwaraKala Studio** are documented in this file.

## [Unreleased]

Engineering-hardening pass: dev environment fixes, a full automated test suite, TypeScript
strict mode, and a verified Content-Security-Policy. No user-facing feature changes.

### Added

- Automated test suite (Vitest + jsdom + fake-indexeddb): 247 tests covering the music-theory
  engine, MIDI import/export, the Web Audio synthesis engine (17 instrument voices + master bus,
  against a structural Web Audio mock), IndexedDB session persistence, localization, bundled
  musical content integrity, and both backends' API contract. ~90% statement / ~92% line
  coverage on all unit-testable logic (`npm test`, `npm run test:coverage`).
- `shared/aiStudio.ts` — the AI-studio request/response contract (validation, sanitization,
  Gemini schemas, error mapping) is now defined once and used by both `server.ts` and
  `worker/index.ts`, removing a prior drift risk between the two deployment targets.
- `shared/securityHeaders.ts` — security headers, including a new verified
  Content-Security-Policy (`script-src 'self'`, no `unsafe-inline`/`unsafe-eval`), applied
  identically by both backends in production. Verified against a real headless-browser load of
  the production build with a `securitypolicyviolation` listener attached: zero violations
  across the Console, Stage 3D (WebGL), AI Architect, and Library views.
- `docs/ARCHITECTURE.md` — technical architecture reference: module map, the dual-backend AI API
  contract, build/deploy pipeline, security-header rationale, and test strategy.
- `package-lock.json` — previously missing, which meant CI's `npm ci` step could not succeed on
  a fresh checkout.

### Changed

- `tsconfig.json`: enabled `strict` and `forceConsistentCasingInFileNames`. The codebase was
  already strict-compatible; this closes the gap between what's enforced and what was true.
- `vite.config.ts`: replaced CommonJS `__dirname` with `import.meta.dirname`, removing a
  `configLoader: 'native'` deprecation warning on every dev/build run.
- `.github/workflows/release-cloudflare.yml`: fixed an invalid `action-gh-release` input
  (`fail_if_unmatched_files` → `fail_on_unmatched_files`), which would have failed release
  publishing on the next tagged release.
- `scripts/verify-repo-compliance.mjs`: the file walker now skips the (gitignored) `coverage/`
  directory, so a local coverage run no longer trips the governance/secret-hygiene scan.

### Fixed

- `package.json` devDependency `esbuild@^0.25.0` conflicted with `vite@^8`'s peer requirement
  (`^0.27 || ^0.28`), breaking `npm install` outright. Bumped to `^0.27.0`.
- Windows-specific `esbuild` dev-server arbitrary-file-read advisory, resolved via `npm audit
  fix`. (Four pre-existing moderate, build-time-only advisories in `vite-plugin-pwa`'s
  `workbox-build` → `glob`/`minimatch` chain remain; no upstream fix is available yet.)

## [1.0.0] - 2026-11-18

### Added
- Multi-tradition DAW console uniting Carnatic, Hindustani, and Western microtonal synthesis, Tanpura drone, and 3-band master DSP.
- Custom geometric **SwaraKala Studio** brand emblem (`BrandLogo`), synced PWA icon set (`180x180`, `192x192`, `512x512`, `512x512 maskable`), standard 3-zone header, and 4-column studio footer.
- Sequencer quantization (`1/2`, `1/4`, `1/8`) with live record snap and multi-section Song Arranger.
- Hardware Web MIDI controller learn & mapping for channel strips, Tanpura, and Master Bus with `CC=64` center detent.
- Interactive 3D Concert Stage (Three.js), 72 Melakarta Chakra, Suladi Tala calculator, 106-entry filterable Discovery Archive, and English / Telugu (`తెలుగు`) / Sanskrit (`संस्कृतम्`) localization.
- Cloudflare Workers edge runtime (`worker/index.ts`, `wrangler.toml`), GitHub DevSecOps CI gates (`.github/workflows/ci-devsecops.yml`), and gated production Cloudflare release workflow (`.github/workflows/release-cloudflare.yml`).
- Full GitHub community health & codeowner compliance maintained under `@adityarachuri`.
