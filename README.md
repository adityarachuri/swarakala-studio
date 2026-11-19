# SwaraKala Studio

**Multi-Tradition AI Music Studio & Offline Progressive Web Workstation**  
*Permanent Codeowner & Author: Aditya Rachuri (`@adityarachuri`)*

SwaraKala Studio unifies Indian **Carnatic**, **Hindustani**, and **Western** music composition into a browser-native workstation designed for composers, music directors, teachers, and students.

For the technical architecture (module map, AI API contract, build/test pipeline), see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Core Architecture & Features

- **Microtonal Web Audio Synthesizer & Tanpura Drone**: 22-Shruti just-intonation tuning offsets (`A4 = 440Hz / 432Hz`), articulated acoustic timbres (Veena, Sitar, Bansuri, Violin, Harmonium, Nadaswaram, Santoor, Piano, Rhodes, Celesta, Strings, French Horn, Bass, Mridangam, Tabla, Drums), master 3-band EQ, tape warmth, stereo delay, algorithmic hall reverb, and compressor bus.
- **Sequencer, Quantization & Song Arranger**: Step sequencer synchronized to cyclic Talas and Western meters (`1/2`, `1/4`, `1/8` quantization snap, gamaka ornament cycling, chromatic/raga lock, multi-section arrangement for *Pallavi / Anupallavi / Charanam / Asthai / Antara / Bridge*).
- **Hardware Web MIDI Controller Mapping**: Full `navigator.requestMIDIAccess()` CC & Note learn workflow mapped directly to console channel strips (Level, Pan, Reverb Send, Mute, Solo), Tanpura controls, and Master Bus parameters with `CC=64` center detent and validated `localStorage` persistence.
- **3D Acoustic Concert Stage**: Interactive Three.js WebGL spatial ensemble environment adapting to Carnatic Sabha, Hindustani Mehfil, and Western Scoring stages.
- **72 Melakarta, 35 Suladi Tala & Canonical Literature Compendium**: Interactive Melakarta Chakra explorer, Suladi Tala Jati calculator, 106-entry filterable Raga & Tala Discovery Archive, and full Telugu (`తెలుగు`), Sanskrit (`संस्कृतम्`), and English (`en`) localization.
- **Studio Composition & Audio Transcription API**: Server-isolated REST endpoints (`/api/studio/compose`, `/api/studio/variation`, `/api/studio/analyze`, `/api/studio/transcribe`) deployed cleanly on **Cloudflare Workers** (`worker/index.ts`) and Express (`server.ts`).
- **Offline-First PWA & Lossless Export**: Workbox offline asset precaching, IndexedDB local session vault, JSON import/export, 24-bit WAV rendering, and Standard MIDI File (`SMF` / `.mid`) export.

---

## Development & Cloudflare Workers Deployment

```bash
# Install dependencies
npm ci

# Run local Express + Vite dev server on http://localhost:3000
npm run dev

# Type-check & production Vite + PWA build
npm run lint
npm run build

# Run the test suite (Vitest) / with coverage
npm test
npm run test:coverage

# Verify repository DevSecOps compliance & bundle checks
npm run verify:compliance

# Deploy to Cloudflare Workers (requires authenticated wrangler CLI)
npx wrangler secret put GEMINI_API_KEY
npm run cf:deploy
```

---

## Governance & Security

- **Permanent Codeowner**: `Aditya Rachuri` (`@adityarachuri`) — [`.github/CODEOWNERS`](.github/CODEOWNERS)
- **Security Policy**: [SECURITY.md](SECURITY.md)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **License**: [MIT](LICENSE)
