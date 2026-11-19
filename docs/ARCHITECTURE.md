# SwaraKala Studio — Technical Architecture

This document describes how the codebase is put together: the runtime architecture, the
module boundaries, the AI composition API contract, the build/deploy pipeline, and the test
strategy. It complements [README.md](../README.md) (features/quickstart), [SECURITY.md](../SECURITY.md)
and [CONTRIBUTING.md](../CONTRIBUTING.md).

## 1. Overview

SwaraKala Studio is a browser-native, offline-capable Digital Audio Workstation for Carnatic,
Hindustani, and Western music composition. It runs entirely client-side (Web Audio API, Three.js,
IndexedDB) except for optional AI-assisted composition/transcription, which is proxied through a
thin server so the Gemini API key never reaches the browser.

It ships as a Progressive Web App and can be deployed two ways from the **same** React/Vite
frontend:

- **Node / Express** (`server.ts`) — for traditional hosting, local dev, and `npm run dev`.
- **Cloudflare Workers** (`worker/index.ts`) — for edge deployment (`npm run cf:deploy`).

Both backends implement the identical `/api/studio/*` contract, defined once in
[`shared/aiStudio.ts`](../shared/aiStudio.ts) (see §5).

## 2. Tech stack

| Layer | Technology |
|---|---|
| UI | React 19, Tailwind CSS 4, `lucide-react` icons, `motion` (Framer Motion) |
| 3D stage | Three.js (procedural textures/models, no external 3D assets) |
| Audio engine | Native Web Audio API (no audio library) — synthesis, scheduling, offline WAV rendering |
| Build | Vite 8, `@vitejs/plugin-react`, `vite-plugin-pwa` (Workbox) |
| Backend (Node) | Express 4 + `@google/genai` (Node SDK) |
| Backend (edge) | Cloudflare Workers (`worker/index.ts`), calling the Gemini REST API directly via `fetch` |
| Persistence | IndexedDB (`src/db/sessionStore.ts`) with an automatic `localStorage` fallback |
| Language | TypeScript (strict-ish; `tsc --noEmit` is the lint gate) |
| Tests | Vitest + `jsdom` + `fake-indexeddb`, `@vitest/coverage-v8` |
| CI/CD | GitHub Actions (`ci-devsecops.yml`, `release-cloudflare.yml`), CodeQL, Gitleaks, SBOM |

## 3. Repository layout

```
server.ts                 Express entrypoint (Node/local dev + non-Workers hosting)
worker/index.ts            Cloudflare Workers entrypoint (edge deploy)
shared/aiStudio.ts         Framework-agnostic AI-studio request/response contract (used by both)
vite.config.ts             Vite + PWA + Tailwind build config
wrangler.toml               Cloudflare Workers deployment manifest
scripts/
  verify-repo-compliance.mjs   Governance/secret-hygiene audit (CI Gate 1 + 3)
  bootstrap-github-cloudflare.sh
src/
  App.tsx                   Root orchestrator: session state, transport, view routing
  main.tsx                   React root + PWA service-worker registration
  components/                Presentational + feature views (see §4.2)
  engine/
    audioEngine.ts            Web Audio synthesis + scheduling (singleton `audioEngine`)
    musicTheory.ts             Scales/ragas, talas, swara parsing, quantization, ornamentation
    midiMapping.ts             Web MIDI CC/Note learn + persistence
    midiExport.ts              Standard MIDI File (.mid) export
  data/
    musicLiterature.ts         72-Melakarta generator, Suladi Tala/Jati tables, literature corpus
    discoveryArchive.ts        Searchable Raga/Tala discovery archive (built from engine + literature data)
    presets.ts                 Bundled reference StudioSession templates
  db/sessionStore.ts          IndexedDB session persistence (+ localStorage fallback)
  i18n/studioLocale.ts        en/te/sa UI strings + swara name localization
  three/                      Procedural Three.js textures/models for the 3D stage
  hooks/                      useOnlineStatus, usePWAInstall
  types/studio.ts             Shared domain types (StudioSession, NoteEvent, ScaleDefinition, ...)
tests/                        Vitest suite, mirrors the src/ layout (see §7)
```

## 4. Frontend architecture

### 4.1 State ownership

`src/App.tsx` is the single source of truth for the active `StudioSession` (see
`src/types/studio.ts` for the full shape: tracks, tanpura, master bus, pedagogy notes, optional
multi-section arrangement). It:

- Loads/saves sessions via `src/db/sessionStore.ts`, seeding `REFERENCE_SESSIONS` on first run.
- Owns the single `audioEngine` instance (`src/engine/audioEngine.ts`) and keeps it in sync with
  session edits via `setSession()` / `applyMasterConfig()`.
- Routes between `StudioView`s (`console | stage3d | architect | pedagogy | library`), lazy-loading
  the heavier views (`AIArchitectView`, `PedagogyView`, `LibraryView`, `ExportModal`,
  `StudioStage3D`) via `React.lazy` so the initial bundle stays small.

### 4.2 Components (`src/components/`)

| Component | Responsibility |
|---|---|
| `MixerConsole` | Per-track channel strips (volume/pan/reverb/mute/solo), master bus EQ/FX controls |
| `SequencerGrid` | Step sequencer grid editor, quantization, gamaka cycling |
| `SongArrangerBar` | Multi-section arrangement (Pallavi/Anupallavi/Charanam, Asthai/Antara, Verse/Chorus) |
| `TalaWheel` | Cyclic Tala/meter visualization and Sam/Tali/Khali indicator |
| `LiveKeyboard` | On-screen/MIDI-mappable piano-style input for live note entry |
| `StudioStage3D` | Three.js 3D concert-stage visualization (Sabha/Mehfil/Scoring Stage) |
| `AIArchitectView` | AI composition/variation/analysis UI — calls `/api/studio/{compose,variation,analyze}` |
| `MicTranscriberPanel` | Records/uploads audio, calls `/api/studio/transcribe` |
| `PedagogyView` | Raga/Tala pedagogy notes, Melakarta Chakra + Suladi Tala explorers |
| `LibraryView` | Saved-session library (list/load/delete via `sessionStore`) |
| `ExportModal` | WAV (via `audioEngine.renderSessionToWavBlob`) and MIDI (`midiExport`) export UI |
| `OscilloscopeMeters` | Realtime level/scope visualization from `audioEngine.getAnalyser()` |
| `OfflineIndicator` / `PWAInstallButton` | PWA install prompt + offline-status UI, backed by `src/hooks/` |
| `BrandLogo` | Static brand mark |

### 4.3 Hooks

- `useOnlineStatus` — wraps `navigator.onLine` + `online`/`offline` events.
- `usePWAInstall` — wraps the `beforeinstallprompt` flow for `PWAInstallButton`.

## 5. Core engine

### 5.1 `audioEngine.ts` — the Web Audio layer

A single exported singleton (`export const audioEngine = new SwaraKalaAudioEngine()`) that owns:

- **Master bus graph** (`buildMasterGraph`): dry/reverb-send buses → convolver (procedurally
  generated impulse response per `reverbRoom`) → 3-band EQ → tape-warmth waveshaper → compressor →
  master gain → analyser. Built lazily on first `ensureContext()`.
- **17 instrument voices** (melodic: veena, sitar, bansuri, nadaswaram, santoor, violin,
  harmonium, piano, rhodes, celesta, stringsEnsemble, frenchHorn, synthPad, bass; percussion:
  mridangam, tabla, drums), each a hand-built oscillator/noise/filter patch — there is no sample
  library.
- **Real-time transport**: `startTransport()`/`stopTransport()` run a `setInterval`-based
  lookahead scheduler (24 ms tick), supporting both single-cycle looping and full multi-section
  arrangement playback.
- **Tanpura drone**: an independent 80 ms-tick scheduler (`syncTanpura`) layering the 4-string
  drone pattern (`Pa`/`Ma`/`Ni` fifth mode configurable).
- **Offline rendering**: `renderSessionToWavBlob()` drives the same voice functions against an
  `OfflineAudioContext` and hand-encodes a 16-bit PCM WAV container.

This is the single largest and most imperative module in the codebase (~1450 lines) and the one
area where **unit tests necessarily stop short of full confidence** — see §7.4.

### 5.2 `musicTheory.ts` — scale/tala domain logic

Pure, framework-agnostic functions over the `ScaleDefinition`/`TalaDefinition`/`NoteEvent` types:
22-shruti just-intonation cents tables, Melakarta/Suladi synthesis (`createScaleFromMelakarta`,
`createTalaFromSuladi`), swara-phrase parsing (`parseSwaraPhraseToNotes`), quantization
(`snapStepToQuantizeGrid`, `quantizeTrackNotes`), and generative helpers (`generateTihaiCadence`,
`applySangatiVariation`, `generateChordStampNotes`). Fully unit-tested (§7).

### 5.3 `midiMapping.ts` / `midiExport.ts`

- `midiMapping.ts`: Web MIDI CC/Note-learn workflow, `localStorage`-backed mapping persistence
  (validated and capped at 64 entries on load), and the `scaleMidiValue` curve used to map a raw
  0–127 CC value onto a parameter range (with an optional CC-64 center detent).
- `midiExport.ts`: hand-rolled Standard MIDI File (format 1) writer — no external MIDI library.
  Flattens multi-section arrangements into absolute step offsets before emitting track chunks.

## 6. Data layer

`src/db/sessionStore.ts` wraps IndexedDB (`swarakala-studio-db` / `sessions` object store) behind
four functions: `getAllSessions`, `saveSession`, `deleteSession`, `seedReferenceSessionsIfEmpty`.
Every function falls back to a capped (`40`-entry) `localStorage` list (`swarakala_studio_sessions_v1`)
when IndexedDB is unavailable, so the app still works in restrictive/private-browsing contexts.

`src/data/` holds the bundled musical content: the generated 72-Melakarta table and Suladi Tala/Jati
tables (`musicLiterature.ts`), the searchable Raga/Tala discovery archive built on top of it
(`discoveryArchive.ts`), and the bundled `REFERENCE_SESSIONS` starter templates (`presets.ts`).
Data-integrity tests (§7) assert every `targetId`/`scaleId`/`talaId` in this content actually
resolves through `musicTheory.ts`, and that no preset note falls outside its declared scale.

## 7. API contract (`shared/aiStudio.ts`) and the two backends

### 7.1 Why a shared module

`server.ts` (Node/Express) and `worker/index.ts` (Cloudflare Workers) are two independent runtimes
calling the Gemini API two different ways (the Node SDK vs. a hand-rolled REST `fetch`), but they
must produce byte-identical request validation and response sanitization — otherwise a client
behaves differently depending on which backend it happens to hit. `shared/aiStudio.ts` is the
single source of truth for:

- Input validation/clamping: `sanitizeText`, `clampSteps`, `clampBpm`, `parseScaleSemitones`,
  `normalizeAudioMime`, `sanitizeTanpuraFifthMode`.
- Output sanitization: `sanitizeTrackNotes` — whitelists instruments/gamakas, caps track/note
  counts (max 6 tracks × 96 notes), and clamps percussion to its 5 valid drum-lane semitone
  offsets. This is what makes an AI-generated response safe to feed straight into the sequencer.
- The Gemini `responseSchema` objects (`COMPOSE_SCHEMA`, `ANALYZE_SCHEMA`).
- Error mapping: `toSafeAiError`/`isTransientAiError` turn upstream Gemini errors into safe,
  non-leaky HTTP status/message pairs without ever echoing the raw upstream error text to the client.

### 7.2 Endpoints (identical on both backends)

| Method & path | Purpose |
|---|---|
| `GET /api/studio/health` | `{status, aiReady, runtime}` — whether a Gemini key is configured |
| `POST /api/studio/compose` | Generate an original 4-track (melody/harmony/bass/percussion) arrangement from a prompt + scale/tala |
| `POST /api/studio/variation` | Transform/enrich an existing arrangement per a free-text instruction |
| `POST /api/studio/analyze` | Score adherence to the declared scale/tala and produce pedagogy feedback |
| `POST /api/studio/transcribe` | Audio → text transcription (base64 clip, ≤7 MB), with a model fallback on 404 |

All AI generation calls use `thinkingLevel: LOW` and are retried up to 2–3 times on transient
upstream errors (`generateWithRetry` / `callGeminiRest`'s retry loop) with a short backoff.

### 7.3 Runtime differences

- **`server.ts`**: Express app; adds a per-IP sliding-window rate limiter (30 req/min) on all
  `/api/studio/*` POST routes, security headers (incl. HSTS in production), a JSON body-size limit
  (256 KB, 10 MB for `/transcribe`), Vite middleware in dev / static `dist/` serving in prod.
- **`worker/index.ts`**: a single `fetch(request, env)` handler; no persistent rate-limit state
  (Workers are stateless per-isolate — rely on Cloudflare's edge-level rate limiting/WAF instead),
  same security headers applied to every response including the `env.ASSETS` static-asset fallback.

### 7.4 Secrets

Neither backend ever sends `GEMINI_API_KEY` to the browser. Node reads it from `process.env`
(`.env` locally, Workers `secret` in production); Workers reads it from the `Env` binding
(`wrangler secret put GEMINI_API_KEY`).

## 8. Build & deployment

- **Dev**: `npm run dev` → `tsx server.ts`, which mounts Vite in middleware mode (HMR on by
  default; `DISABLE_HMR=true` disables it).
- **Production build**: `npm run build` → `vite build` (React + Tailwind + PWA/Workbox
  precaching) emitting `dist/`.
- **Node hosting**: `npm run build && npm start` (`node server.ts`, `NODE_ENV=production`
  serves `dist/` statically).
- **Cloudflare Workers**: `npm run cf:deploy` (`vite build && wrangler deploy`); `wrangler.toml`
  binds the built `dist/` as static assets and routes everything else through `worker/index.ts`.
- **CI** (`.github/workflows/ci-devsecops.yml`, on every push/PR to `main`):
  1. *Hygiene & compliance* — `scripts/verify-repo-compliance.mjs` (governance files, codeowner,
     forbidden-attribution/secret-pattern scan) + Gitleaks.
  2. *SAST & dependency audit* — `npm ci --ignore-scripts`, `npm audit --audit-level=high`, CodeQL.
  3. *Build/test/SBOM* — `tsc --noEmit`, `vite build`, an `esbuild` bundle-ability check of
     `worker/index.ts`, the compliance check again with `--with-dist` (also scans built JS for an
     accidentally-inlined API key), then an SPDX SBOM is generated and uploaded.
- **Release** (`.github/workflows/release-cloudflare.yml`, on `v*.*.*` tags): re-runs the lint/build
  gates, then deploys to Cloudflare Workers via `wrangler-action`, syncing the `GEMINI_API_KEY`
  secret and publishing a GitHub Release.

## 9. Testing (`tests/`)

The suite uses Vitest with `environment: 'jsdom'` and `fake-indexeddb/auto` (see
`vitest.config.ts` / `tests/setup.ts`). It mirrors `src/`:

- `tests/shared/aiStudio.test.ts` — the full validation/sanitization/error-mapping contract.
- `tests/engine/musicTheory.test.ts`, `midiMapping.test.ts`, `midiExport.test.ts` — pure logic,
  including SMF byte-level header assertions and localStorage-persistence edge cases.
- `tests/engine/audioEngine.test.ts` — a structural smoke test against a hand-written Web Audio
  API mock (`tests/mocks/webAudioMock.ts`): confirms the master-bus graph builds, every
  instrument voice (melodic + percussion) and gamaka renders without throwing, the real-time
  transport/tanpura schedulers run and stop cleanly (via `vi.useFakeTimers`), and
  `renderSessionToWavBlob` produces a valid RIFF/WAVE container. **It intentionally does not
  assert anything about the resulting audio's correctness** — jsdom has no real audio backend, so
  there is no way to assert that from a unit test. Audible/perceptual correctness should continue
  to be verified by manual or browser-automation (Playwright) QA, not by mocking deeper.
- `tests/db/sessionStore.test.ts` — IndexedDB round-trip via `fake-indexeddb`, plus the
  `localStorage` fallback path (exercised by temporarily deleting `globalThis.indexedDB`).
- `tests/i18n/studioLocale.test.ts`, `tests/data/*.test.ts` — localization completeness and
  bundled-content integrity (every preset/discovery-archive entry resolves to a real
  scale/tala and stays within it).
- `tests/worker/index.test.ts` — the Cloudflare Worker `fetch` handler end-to-end, with
  `global.fetch` stubbed to simulate the upstream Gemini REST API (success, 503, 403, 404-fallback,
  malformed JSON, oversized payload, missing-secret, `ASSETS` fallback).

Run with `npm test` (single run) or `npm run test:coverage` (adds a v8 coverage report). React
components (`src/components/`, `src/App.tsx`) and the Three.js procedural-asset modules
(`src/three/`) are deliberately **out of scope for this unit suite** — they are UI/rendering code
better verified by manual exploratory testing or a future Playwright/Testing-Library pass, and
including them in the coverage target would reward shallow render-only tests rather than
meaningful ones.

## 10. Security headers

Defined once in `shared/securityHeaders.ts` and applied identically by both backends:
`X-Content-Type-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`,
`X-Permitted-Cross-Domain-Policies`, `Permissions-Policy` (camera/geolocation/USB denied;
microphone/MIDI allowed same-origin only) on every response, plus HSTS and a
Content-Security-Policy in production:

```text
default-src 'self'; script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self';
worker-src 'self'; manifest-src 'self'; object-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

`script-src` is a strict `'self'` with no `unsafe-inline`/`unsafe-eval` — the app has no inline
`<script>` tags and no `eval`/`new Function` usage anywhere, so this provides real XSS
mitigation. `style-src` keeps `'unsafe-inline'` (CSS injection is lower-severity than script
injection, and verifying every component never touches `style` via `setAttribute` was judged
not worth the risk/reward here). `connect-src 'self'` is intentional: the browser only ever talks
to this app's own `/api/studio/*` routes — the Gemini key and all AI calls stay server-side (§7).

**On `server.ts`**, CSP/HSTS are gated behind `IS_PROD` — Vite's dev-mode HMR client wasn't
re-verified against a CSP and pinning `localhost` to HTTPS via HSTS would be actively harmful in
dev, so both are left off there. **On `worker/index.ts`**, both are applied unconditionally —
Workers only ever serves the built production bundle, there is no "dev mode" to protect.

This policy was verified against a real build and a real (headless Chromium) browser before being
enabled: `npm run build && NODE_ENV=production node server.ts`, then loaded with
`document.addEventListener('securitypolicyviolation', …)` attached — zero violations across the
Console, Stage 3D (WebGL canvas), AI Architect, and Library views, including Telugu/Devanagari
web-font rendering. It is not, however, verified against every possible session state (e.g. every
export/MIDI-mapping flow) — treat it as a strong baseline, not an exhaustive guarantee, and watch
for `securitypolicyviolation` reports (e.g. via a `report-uri`/`report-to` directive) if traffic
patterns the automated check didn't cover reveal a real gap.

## 11. Known architectural trade-offs

- **`audioEngine.ts` is one large stateful class.** This is a deliberate trade-off for a
  real-time audio scheduler (shared `AudioContext`/graph state, tight timing budget) rather than
  an oversight — but it does mean the module is harder to unit-test deeply than the rest of the
  engine layer (see §9).
- **Two backend runtimes duplicate the HTTP plumbing** (routing, header-setting, body parsing) by
  necessity — Express and the Workers `fetch` handler are different programming models — but no
  longer duplicate the *business logic* or *security-header values*; those live only in
  `shared/aiStudio.ts` and `shared/securityHeaders.ts` respectively.
