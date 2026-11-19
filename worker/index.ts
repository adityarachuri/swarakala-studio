import {
  ANALYZE_SCHEMA,
  clampBpm,
  clampSteps,
  COMPOSE_SCHEMA,
  getLocaleDirective,
  normalizeAudioMime,
  parseScaleSemitones,
  sanitizeTanpuraFifthMode,
  sanitizeText,
  sanitizeTrackNotes,
  toSafeAiError,
  VALID_AUDIO_MIMES,
  VALID_TRADITIONS,
} from '../shared/aiStudio.ts';
import {BASE_SECURITY_HEADERS, PROD_ONLY_SECURITY_HEADERS} from '../shared/securityHeaders.ts';

interface AssetsFetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface Env {
  ASSETS?: AssetsFetcher;
  GEMINI_API_KEY?: string;
  APP_ENV?: string;
  CODEOWNER?: string;
}

function applySecurityHeaders(headers: Headers): Headers {
  // Workers only ever serves the production build, so the prod-only
  // headers (CSP/HSTS) apply unconditionally here (unlike server.ts, which
  // also serves Vite's dev mode where CSP would need separate verification).
  for (const [name, value] of Object.entries({
    ...BASE_SECURITY_HEADERS,
    ...PROD_ONLY_SECURITY_HEADERS,
  })) {
    headers.set(name, value);
  }
  return headers;
}

function jsonResponse(data: unknown, status = 200): Response {
  const headers = applySecurityHeaders(new Headers({'Content-Type': 'application/json; charset=utf-8'}));
  return new Response(JSON.stringify(data), {status, headers});
}

async function callGeminiRest(
  apiKey: string,
  model: string,
  payload: Record<string, unknown>,
  maxAttempts = 3
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let lastErr: Error = new Error('Upstream request failed');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SwaraKala-Studio/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const bodyText = await resp.text().catch(() => '');
        const err = new Error(`HTTP ${resp.status}: ${bodyText.slice(0, 300)}`);
        if ((resp.status === 500 || resp.status === 503) && attempt < maxAttempts) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, attempt === 1 ? 650 : 1600));
          continue;
        }
        throw err;
      }

      const data = (await resp.json()) as {
        candidates?: Array<{content?: {parts?: Array<{text?: string}>}}>;
      };
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? '')
          .join('')
          .trim() ?? '';
      return text;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const msg = lastErr.message.toLowerCase();
      if (attempt < maxAttempts && (msg.includes('503') || msg.includes('500') || msg.includes('fetch'))) {
        await new Promise((r) => setTimeout(r, attempt === 1 ? 650 : 1600));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

function logAndMakeSafeAiError(err: unknown, fallbackMessage: string): {status: number; error: string} {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  console.error('[SwaraKala Worker Error]', raw.slice(0, 400));
  return toSafeAiError(err, fallbackMessage);
}

async function parseJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown> | Response> {
  const lenHeader = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(lenHeader) && lenHeader > maxBytes) {
    return jsonResponse({error: 'Request payload too large.'}, 413);
  }
  const text = await request.text();
  if (text.length > maxBytes) {
    return jsonResponse({error: 'Request payload too large.'}, 413);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return jsonResponse({error: 'Malformed JSON request body.'}, 400);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/studio/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        aiReady: Boolean(env.GEMINI_API_KEY?.trim()),
        runtime: 'cloudflare-workers',
      });
    }

    if (url.pathname.startsWith('/api/studio/') && request.method === 'POST') {
      const apiKey = env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        return jsonResponse(
          {error: 'Server generation secret is not configured in Cloudflare Workers.'},
          503
        );
      }

      if (url.pathname === '/api/studio/transcribe') {
        const parsedOrErr = await parseJsonBody(request, 10_500_000);
        if (parsedOrErr instanceof Response) return parsedOrErr;

        const rawBase64 = typeof parsedOrErr.audioBase64 === 'string' ? parsedOrErr.audioBase64.trim() : '';
        const mimeRaw = sanitizeText(parsedOrErr.mimeType, 64).split(';')[0].trim().toLowerCase();
        if (mimeRaw && !VALID_AUDIO_MIMES.has(mimeRaw)) {
          return jsonResponse({error: `Unsupported audio format (${mimeRaw}).`}, 400);
        }
        const mimeType = normalizeAudioMime(mimeRaw);
        if (!rawBase64 || rawBase64.length > 10_000_000) {
          return jsonResponse({error: 'Provide a valid audio clip (max ~7 MB).'}, 400);
        }
        const hint = sanitizeText(parsedOrErr.contextHint, 200);
        const promptText = hint
          ? `Transcribe this studio audio accurately, preserving swaras, lyrics, or rhythmic syllables. Context: ${hint}`
          : 'Transcribe this studio audio accurately, preserving spoken musical terms, swaras, rhythmic syllables, or lyrics.';

        const payload = {
          contents: [
            {
              parts: [{inlineData: {mimeType, data: rawBase64}}, {text: promptText}],
            },
          ],
        };

        try {
          let transcript: string;
          try {
            transcript = await callGeminiRest(apiKey, 'gemini-3.5-transcribe', payload, 2);
          } catch (err) {
            const msg = (err instanceof Error ? err.message : '').toLowerCase();
            if (msg.includes('404') || msg.includes('not_found') || msg.includes('not supported')) {
              transcript = await callGeminiRest(apiKey, 'gemini-4-hydrogen', payload, 3);
            } else {
              throw err;
            }
          }
          return jsonResponse({transcript});
        } catch (err) {
          const safe = toSafeAiError(err, 'Audio transcription failed.');
          return jsonResponse({error: safe.error}, safe.status);
        }
      }

      if (url.pathname === '/api/studio/compose') {
        const body = await parseJsonBody(request, 262_144);
        if (body instanceof Response) return body;

        const prompt = sanitizeText(body.prompt, 600);
        const tradition = sanitizeText(body.tradition, 24);
        const scaleName = sanitizeText(body.scaleName, 80);
        const scaleSemitones = parseScaleSemitones(body.scaleSemitones);
        const talaName = sanitizeText(body.talaName, 80);
        const totalSteps = clampSteps(body.totalSteps, 16);
        const targetAudience = sanitizeText(body.targetAudience, 40) || 'Music Director';
        const localeDirective = getLocaleDirective(body.locale);

        if (!prompt || !VALID_TRADITIONS.has(tradition)) {
          return jsonResponse({error: 'Please provide a valid musical prompt and tradition.'}, 400);
        }

        try {
          const rawText = await callGeminiRest(apiKey, 'gemini-4-hydrogen', {
            systemInstruction: {
              parts: [
                {
                  text: `You are a master music director, Carnatic & Hindustani Vidwan, and Western conservatory orchestrator.
Compose an original multi-track studio arrangement in strict JSON.
${localeDirective}
- Melodic/harmony notes must strictly respect semitone pitch classes [${scaleSemitones.join(', ')}] mod 12 across totalSteps=${totalSteps}.
- Percussion track must use only semitoneOffset values 0, 2, 4, 5, or 7.
- Tailor depth for: ${targetAudience}.`,
                },
              ],
            },
            contents: [
              {
                parts: [
                  {
                    text: `Compose a ${tradition} piece for Scale/Raga ${scaleName}, Tala/Meter ${talaName} (${totalSteps} steps). Brief: ${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: COMPOSE_SCHEMA,
              thinkingConfig: {thinkingLevel: 'LOW'},
            },
          });

          const parsed = JSON.parse(rawText) as Record<string, unknown>;
          const tracks = sanitizeTrackNotes(parsed.tracks, totalSteps);
          return jsonResponse({
            title: sanitizeText(parsed.title, 80) || 'Untitled Studio Piece',
            subtitle: sanitizeText(parsed.subtitle, 100) || `${scaleName} · ${talaName}`,
            bpm: clampBpm(parsed.bpm),
            tanpuraFifthMode: sanitizeTanpuraFifthMode(parsed.tanpuraFifthMode),
            tracks,
            pedagogy: parsed.pedagogy ?? {},
          });
        } catch (err) {
          const safe = logAndMakeSafeAiError(err, 'Studio composition request failed.');
          return jsonResponse({error: safe.error}, safe.status);
        }
      }

      if (url.pathname === '/api/studio/variation') {
        const body = await parseJsonBody(request, 262_144);
        if (body instanceof Response) return body;

        const instruction = sanitizeText(body.instruction, 400);
        const tradition = sanitizeText(body.tradition, 24);
        const scaleName = sanitizeText(body.scaleName, 80);
        const scaleSemitones = parseScaleSemitones(body.scaleSemitones);
        const totalSteps = clampSteps(body.totalSteps, 16);
        const currentTracks = Array.isArray(body.tracks) ? body.tracks.slice(0, 6) : [];
        const localeDirective = getLocaleDirective(body.locale);

        if (!instruction) {
          return jsonResponse({error: 'Please specify a variation or arrangement instruction.'}, 400);
        }

        try {
          const rawText = await callGeminiRest(apiKey, 'gemini-4-hydrogen', {
            systemInstruction: {
              parts: [
                {
                  text: `You are a master arranger. Preserve scale coherence [${scaleSemitones.join(', ')}] and totalSteps=${totalSteps}. ${localeDirective}`,
                },
              ],
            },
            contents: [
              {
                parts: [
                  {
                    text: `Create a variation for ${tradition} (${scaleName}, ${totalSteps} steps). Instruction: ${instruction}. Tracks: ${JSON.stringify(currentTracks).slice(0, 8000)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: COMPOSE_SCHEMA,
              thinkingConfig: {thinkingLevel: 'LOW'},
            },
          });

          const parsed = JSON.parse(rawText) as Record<string, unknown>;
          return jsonResponse({
            title: sanitizeText(parsed.title, 80),
            subtitle: sanitizeText(parsed.subtitle, 100),
            bpm: clampBpm(parsed.bpm),
            tracks: sanitizeTrackNotes(parsed.tracks, totalSteps),
            pedagogy: parsed.pedagogy ?? {},
          });
        } catch (err) {
          const safe = logAndMakeSafeAiError(err, 'Studio variation request failed.');
          return jsonResponse({error: safe.error}, safe.status);
        }
      }

      if (url.pathname === '/api/studio/analyze') {
        const body = await parseJsonBody(request, 262_144);
        if (body instanceof Response) return body;

        const tradition = sanitizeText(body.tradition, 24);
        const scaleName = sanitizeText(body.scaleName, 80);
        const talaName = sanitizeText(body.talaName, 80);
        const scaleSemitones = Array.isArray(body.scaleSemitones)
          ? body.scaleSemitones.slice(0, 12).map(Number).filter(Number.isFinite)
          : [];
        const safeNotes = Array.isArray(body.melodyNotes) ? body.melodyNotes.slice(0, 120) : [];
        const localeDirective = getLocaleDirective(body.locale);

        try {
          const rawText = await callGeminiRest(apiKey, 'gemini-4-hydrogen', {
            systemInstruction: {
              parts: [
                {
                  text: `You are a grounded conservatory musicologist. ${localeDirective} Compute scale adherence accurately from allowed pitch classes.`,
                },
              ],
            },
            contents: [
              {
                parts: [
                  {
                    text: `Audit composition: Tradition=${tradition}, Scale=${scaleName} (${JSON.stringify(scaleSemitones)}), Tala=${talaName}, Notes=${sanitizeText(JSON.stringify(safeNotes), 2400)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: ANALYZE_SCHEMA,
              thinkingConfig: {thinkingLevel: 'LOW'},
            },
          });

          return jsonResponse(JSON.parse(rawText));
        } catch (err) {
          const safe = logAndMakeSafeAiError(err, 'Musicology analysis failed.');
          return jsonResponse({error: safe.error}, safe.status);
        }
      }
    }

    if (env.ASSETS) {
      const assetResp = await env.ASSETS.fetch(request);
      const nextHeaders = applySecurityHeaders(new Headers(assetResp.headers));
      return new Response(assetResp.body, {
        status: assetResp.status,
        statusText: assetResp.statusText,
        headers: nextHeaders,
      });
    }

    return jsonResponse({error: 'Not Found'}, 404);
  },
};
