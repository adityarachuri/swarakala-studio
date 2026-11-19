import 'dotenv/config';
import express from 'express';
import type {NextFunction, Request, Response} from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';
import {GoogleGenAI, ThinkingLevel} from '@google/genai';
import type {Schema} from '@google/genai';
import {
  ANALYZE_SCHEMA,
  clampBpm,
  clampSteps,
  COMPOSE_SCHEMA,
  getLocaleDirective,
  normalizeAudioMime,
  sanitizeTanpuraFifthMode,
  sanitizeText,
  sanitizeTrackNotes,
  isTransientAiError,
  parseScaleSemitones,
  toSafeAiError,
  VALID_AUDIO_MIMES,
  VALID_TRADITIONS,
} from './shared/aiStudio.ts';
import {BASE_SECURITY_HEADERS, PROD_ONLY_SECURITY_HEADERS} from './shared/securityHeaders.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Server-side Gemini client (never exposed to browser)
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'SwaraKala-Studio/1.0',
      },
    },
  });
}

// Sliding-window rate limiter per IP for AI endpoints
const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (rateBuckets.size > 200) {
    for (const [key, timestamps] of rateBuckets.entries()) {
      if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] >= RATE_WINDOW_MS) {
        rateBuckets.delete(key);
      }
    }
  }

  const prev = rateBuckets.get(ip) ?? [];
  const active = prev.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (active.length >= RATE_LIMIT) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_WINDOW_MS / 1000)));
    res.status(429).json({
      error: 'Rate limit reached. Please wait a minute before sending another studio AI request.',
    });
    return;
  }
  active.push(now);
  rateBuckets.set(ip, active);
  next();
}

function logAndMakeSafeAiError(err: unknown, fallbackMessage: string): {status: number; error: string} {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  console.error('[SwaraKala AI Error]', raw.slice(0, 500));
  return toSafeAiError(err, fallbackMessage);
}

async function generateWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxAttempts = 3
) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isTransientAiError(err)) {
        throw err;
      }
      const delayMs = attempt === 1 ? 650 : 1600;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers (CSP/HSTS are production-only - see shared/securityHeaders.ts)
  app.use((_req, res, next) => {
    for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
      res.setHeader(name, value);
    }
    if (IS_PROD) {
      for (const [name, value] of Object.entries(PROD_ONLY_SECURITY_HEADERS)) {
        res.setHeader(name, value);
      }
    }
    next();
  });

  app.use((req, res, next) => {
    if (req.path === '/api/studio/transcribe') {
      express.json({limit: '10mb'})(req, res, next);
    } else {
      express.json({limit: '256kb'})(req, res, next);
    }
  });

  // Catch malformed JSON payloads cleanly without exposing Express stack traces
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({error: 'Malformed JSON request body.'});
      return;
    }
    next(err);
  });

  app.get('/api/studio/health', (_req, res) => {
    const configured = Boolean(process.env.GEMINI_API_KEY?.trim());
    res.json({status: 'ok', aiReady: configured});
  });

  app.post('/api/studio/transcribe', rateLimitMiddleware, async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Check Settings > Secrets.',
      });
      return;
    }

    const rawBase64 = typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64.trim() : '';
    const mimeRaw = sanitizeText(req.body?.mimeType, 64).split(';')[0].trim().toLowerCase();
    if (mimeRaw && !VALID_AUDIO_MIMES.has(mimeRaw)) {
      res.status(400).json({error: `Unsupported audio format (${mimeRaw}). Use WAV, MP3, WebM, OGG, M4A, AAC, or FLAC.`});
      return;
    }
    const mimeType = normalizeAudioMime(mimeRaw);
    const contextHint = sanitizeText(req.body?.contextHint, 200);

    if (!rawBase64 || rawBase64.length > 10_000_000) {
      res.status(400).json({error: 'Please provide a valid recorded or uploaded audio clip (max ~7 MB).'});
      return;
    }

    try {
      const audioPart = {
        inlineData: {
          mimeType,
          data: rawBase64,
        },
      };
      const promptText = contextHint
        ? `Transcribe this studio audio accurately, preserving any spoken musical terms, swaras (Sa Ri Ga Ma Pa Dha Ni), Telugu/Sanskrit lyrics, solkattu, or rhythm syllables. If the clip is silent or has no discernible speech/vocals, reply cleanly with an empty or brief note. Context: ${contextHint}`
        : 'Transcribe this studio audio accurately, preserving any spoken musical terms, swaras, rhythmic syllables, or lyrics. If silent, state that no vocals or speech were detected.';

      let response;
      try {
        const betaAi = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY?.trim() ?? '',
          apiVersion: 'v1beta',
          httpOptions: {headers: {'User-Agent': 'SwaraKala-Studio/1.0'}},
        });
        response = await generateWithRetry(betaAi, {
          model: 'gemini-3.5-transcribe',
          contents: {parts: [audioPart, {text: promptText}]},
        }, 2);
      } catch (transcribeErr) {
        const msg = (transcribeErr instanceof Error ? transcribeErr.message : '').toLowerCase();
        if (msg.includes('404') || msg.includes('not_found') || msg.includes('not supported')) {
          response = await generateWithRetry(ai, {
            model: 'gemini-4-hydrogen',
            contents: {parts: [audioPart, {text: promptText}]},
          });
        } else {
          throw transcribeErr;
        }
      }

      const transcript = (response.text ?? '').trim();
      res.json({transcript});
    } catch (err) {
      const safe = logAndMakeSafeAiError(err, 'Audio transcription failed. Verify recorded audio clip format.');
      res.status(safe.status).json({error: safe.error});
    }
  });

  app.post('/api/studio/compose', rateLimitMiddleware, async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Check Settings > Secrets.',
      });
      return;
    }

    const prompt = sanitizeText(req.body?.prompt, 600);
    const tradition = sanitizeText(req.body?.tradition, 24);
    const scaleName = sanitizeText(req.body?.scaleName, 80);
    const scaleSemitones = parseScaleSemitones(req.body?.scaleSemitones);
    const talaName = sanitizeText(req.body?.talaName, 80);
    const totalSteps = clampSteps(req.body?.totalSteps, 16);
    const targetAudience = sanitizeText(req.body?.targetAudience, 40) || 'Music Director';
    const localeDirective = getLocaleDirective(req.body?.locale);

    if (!prompt || !VALID_TRADITIONS.has(tradition)) {
      res.status(400).json({error: 'Please provide a valid musical prompt and tradition.'});
      return;
    }

    const systemInstruction = `You are a master music director, Carnatic & Hindustani Vidwan, and Western conservatory orchestrator.
Your task is to compose an original, playable multi-track studio arrangement in strict JSON.
${localeDirective}
CRITICAL ETHICAL & LITERATURE HONESTY RULES:
- Never fabricate or falsely attribute lyrics/sahitya to historical composers (e.g., do not claim a generated verse is by Tyagaraja, Muthuswami Dikshitar, Tansen, Annamacharya, or Bach).
- Explicitly state in sourceAttributionNote that the tune, motifs, and lyrics/solkattu are original studio compositions created for this session.
- Melodic & harmony notes MUST strictly respect the provided scale semitone pitch classes: [${scaleSemitones.join(', ')}] (mod 12), spanning semitoneOffset -12 to +24 (where 0 is tonic Sa / Root).
- Choose authentic instruments from: veena, sitar, bansuri, violin, harmonium, nadaswaram, santoor, piano, rhodes, celesta, synthPad, stringsEnsemble, frenchHorn, bass, mridangam, tabla, drums.
- Bass track should sit in lower register (-12 to 0) on tonic/fifth/root harmonic anchors.
- Percussion track MUST use ONLY semitoneOffset values 0 (bass/tha/kick), 2 (na/dhi/snare), 4 (thom/hat), 5 (tin/open), or 7 (chapu/ke/rim), aligned tightly to step 0 (Sam) and the Tala/meter structure.
- Total steps in the cycle = ${totalSteps} (step indices 0 through ${totalSteps - 1}).
- Tailor musical sophistication and pedagogical notes for: ${targetAudience}.`;

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Compose a ${tradition} studio piece.
Scale/Raga: ${scaleName} (allowed pitch classes mod 12: ${scaleSemitones.join(', ')})
Tala/Meter: ${talaName} (${totalSteps} steps total)
Director's Brief: ${prompt}
Return 4 cohesive tracks: melody, harmony, bass, and percussion.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: COMPOSE_SCHEMA as unknown as Schema,
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
        },
      });

      const raw = (response.text ?? '').trim();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const tracks = sanitizeTrackNotes(parsed.tracks, totalSteps);

      res.json({
        title: sanitizeText(parsed.title, 80) || 'Untitled Studio Piece',
        subtitle: sanitizeText(parsed.subtitle, 100) || `${scaleName} · ${talaName}`,
        bpm: clampBpm(parsed.bpm),
        tanpuraFifthMode: sanitizeTanpuraFifthMode(parsed.tanpuraFifthMode),
        tracks,
        pedagogy: parsed.pedagogy ?? {},
      });
    } catch (err) {
      const safe = logAndMakeSafeAiError(err, 'AI composition request failed.');
      res.status(safe.status).json({error: safe.error});
    }
  });

  app.post('/api/studio/variation', rateLimitMiddleware, async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Check Settings > Secrets.',
      });
      return;
    }

    const instruction = sanitizeText(req.body?.instruction, 400);
    const tradition = sanitizeText(req.body?.tradition, 24);
    const scaleName = sanitizeText(req.body?.scaleName, 80);
    const scaleSemitones = parseScaleSemitones(req.body?.scaleSemitones);
    const totalSteps = clampSteps(req.body?.totalSteps, 16);
    const currentTracks = Array.isArray(req.body?.tracks) ? req.body.tracks.slice(0, 6) : [];
    const localeDirective = getLocaleDirective(req.body?.locale);

    if (!instruction) {
      res.status(400).json({error: 'Please specify a variation or arrangement instruction.'});
      return;
    }

    try {
      const compactTracks = currentTracks.map((t: Record<string, unknown>) => ({
        name: sanitizeText(t.name, 48),
        role: sanitizeText(t.role, 16),
        instrument: sanitizeText(t.instrument, 24),
        notes: Array.isArray(t.notes)
          ? (t.notes as Array<Record<string, unknown>>).slice(0, 40).map((n) => ({
              step: Number(n.step) || 0,
              durationSteps: Number(n.durationSteps) || 1,
              semitoneOffset: Number(n.semitoneOffset) || 0,
              gamaka: sanitizeText(n.gamaka, 16),
            }))
          : [],
      }));

      const response = await generateWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Transform or enrich this existing ${tradition} arrangement (${scaleName}, pitch classes mod 12: [${scaleSemitones.join(', ')}], ${totalSteps} steps).
Instruction: ${instruction}
Current Tracks JSON: ${JSON.stringify(compactTracks)}`,
        config: {
          systemInstruction: `You are a master arranger. Preserve musical coherence with the provided scale pitch classes and totalSteps. ${localeDirective} Return an updated 4-track arrangement in the exact schema. Be honest in sourceAttributionNote that this is an AI-assisted arrangement variation.`,
          responseMimeType: 'application/json',
          responseSchema: COMPOSE_SCHEMA as unknown as Schema,
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
        },
      });

      const parsed = JSON.parse((response.text ?? '').trim()) as Record<string, unknown>;
      const tracks = sanitizeTrackNotes(parsed.tracks, totalSteps);
      res.json({
        title: sanitizeText(parsed.title, 80),
        subtitle: sanitizeText(parsed.subtitle, 100),
        bpm: clampBpm(parsed.bpm),
        tracks,
        pedagogy: parsed.pedagogy ?? {},
      });
    } catch (err) {
      const safe = logAndMakeSafeAiError(err, 'AI variation request failed.');
      res.status(safe.status).json({error: safe.error});
    }
  });

  app.post('/api/studio/analyze', rateLimitMiddleware, async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Check Settings > Secrets.',
      });
      return;
    }

    const tradition = sanitizeText(req.body?.tradition, 24);
    const scaleName = sanitizeText(req.body?.scaleName, 80);
    const talaName = sanitizeText(req.body?.talaName, 80);
    const scaleSemitones = Array.isArray(req.body?.scaleSemitones)
      ? req.body.scaleSemitones
          .slice(0, 12)
          .map((n: unknown) => Number(n))
          .filter((n: number) => Number.isFinite(n))
      : ([] as number[]);
    const safeNotes = Array.isArray(req.body?.melodyNotes) ? req.body.melodyNotes.slice(0, 120) : [];
    const melodySummary = sanitizeText(JSON.stringify(safeNotes), 2400);
    const localeDirective = getLocaleDirective(req.body?.locale);

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: `Analyze this student/director composition:
Tradition: ${tradition}
Raga/Scale: ${scaleName} (allowed pitch classes mod 12: ${JSON.stringify(scaleSemitones)})
Tala/Meter: ${talaName}
Melody & Track Events: ${melodySummary}`,
        config: {
          systemInstruction: `You are a grounded conservatory professor and musicologist. ${localeDirective} Compute scale adherence accurately from the provided pitch classes, highlight any out-of-scale notes transparently, comment on Sam/Tala phrasing, and suggest actionable drills and director refinements. Never fabricate historical citations.`,
          responseMimeType: 'application/json',
          responseSchema: ANALYZE_SCHEMA as unknown as Schema,
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
        },
      });

      const parsed = JSON.parse((response.text ?? '').trim());
      res.json(parsed);
    } catch (err) {
      const safe = logAndMakeSafeAiError(err, 'AI musicology analysis failed.');
      res.status(safe.status).json({error: safe.error});
    }
  });

  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const {createServer: createViteServer} = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: {server: httpServer},
        hmr: disableHmr ? false : true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, {maxAge: '1d'}));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SwaraKala Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
