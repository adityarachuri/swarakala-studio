/**
 * Framework-agnostic composition-API request/response contract shared
 * between the Express runtime (server.ts, Node) and the Cloudflare Worker
 * runtime (worker/index.ts, V8 isolate). Keeping validation, sanitization,
 * and the Gemini response schema in one place prevents the two deployment
 * targets from silently drifting apart.
 */

export const VALID_TRADITIONS = new Set(['carnatic', 'hindustani', 'western']);

export const VALID_INSTRUMENTS = new Set([
  'veena',
  'sitar',
  'bansuri',
  'violin',
  'harmonium',
  'nadaswaram',
  'santoor',
  'piano',
  'rhodes',
  'celesta',
  'synthPad',
  'stringsEnsemble',
  'frenchHorn',
  'bass',
  'mridangam',
  'tabla',
  'drums',
]);

export const VALID_GAMAKAS = new Set([
  'none',
  'kampita',
  'meend',
  'nokku',
  'andolan',
  'sphurita',
  'staccato',
]);

export const VALID_AUDIO_MIMES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/vnd.wave',
  'audio/ogg',
  'audio/opus',
  'audio/aac',
  'audio/flac',
]);

export const PERCUSSION_SEMITONE_OFFSETS = [0, 2, 4, 5, 7];

/** Plain-string JSON-schema shape accepted by the Gemini `responseSchema`
 * field on both the Node SDK (cast to its `Schema` type at the call site)
 * and the Workers REST payload (used as-is). */
export const COMPOSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: {type: 'STRING', description: 'Poetic, evocative studio title for this original tune.'},
    subtitle: {type: 'STRING', description: 'Tradition · Raga/Scale · Tala/Meter summary.'},
    bpm: {type: 'INTEGER', description: 'Suggested tempo between 52 and 160.'},
    tanpuraFifthMode: {type: 'STRING', description: 'Pa, Ma, or Ni'},
    tracks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: {type: 'STRING'},
          role: {type: 'STRING', description: 'melody, harmony, bass, or percussion'},
          instrument: {
            type: 'STRING',
            description:
              'One of: veena, sitar, bansuri, violin, harmonium, nadaswaram, santoor, piano, rhodes, celesta, synthPad, stringsEnsemble, frenchHorn, bass, mridangam, tabla, drums',
          },
          notes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                step: {type: 'INTEGER', description: '0-based step index within totalSteps'},
                durationSteps: {type: 'INTEGER', description: '1 to 8'},
                semitoneOffset: {
                  type: 'INTEGER',
                  description:
                    'For melodic tracks: -12 to +24 relative to tonic 0. For percussion tracks: strictly one of 0, 2, 4, 5, 7.',
                },
                velocity: {type: 'NUMBER', description: '0.35 to 1.0'},
                gamaka: {
                  type: 'STRING',
                  description: 'none, kampita, meend, nokku, andolan, sphurita, or staccato',
                },
                syllable: {type: 'STRING', description: 'Swara, bol, or solkattu syllable'},
              },
              required: ['step', 'durationSteps', 'semitoneOffset', 'velocity', 'gamaka'],
            },
          },
        },
        required: ['name', 'role', 'instrument', 'notes'],
      },
    },
    pedagogy: {
      type: 'OBJECT',
      properties: {
        chordProgression: {type: 'STRING'},
        performanceGuidance: {type: 'STRING'},
        sahityaOrLyrics: {type: 'STRING'},
        solkattuOrBol: {type: 'STRING'},
        sourceAttributionNote: {type: 'STRING'},
      },
      required: [
        'chordProgression',
        'performanceGuidance',
        'sahityaOrLyrics',
        'solkattuOrBol',
        'sourceAttributionNote',
      ],
    },
  },
  required: ['title', 'subtitle', 'bpm', 'tanpuraFifthMode', 'tracks', 'pedagogy'],
} as const;

export const ANALYZE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: {type: 'STRING'},
    scaleAdherencePercent: {type: 'NUMBER'},
    outOfScaleNotes: {type: 'ARRAY', items: {type: 'STRING'}},
    rhythmicAlignment: {type: 'STRING'},
    pedagogicalDrills: {type: 'ARRAY', items: {type: 'STRING'}},
    directorSuggestions: {type: 'ARRAY', items: {type: 'STRING'}},
  },
  required: [
    'summary',
    'scaleAdherencePercent',
    'outOfScaleNotes',
    'rhythmicAlignment',
    'pedagogicalDrills',
    'directorSuggestions',
  ],
} as const;

export interface SanitizedNoteEvent {
  id: string;
  step: number;
  durationSteps: number;
  semitoneOffset: number;
  velocity: number;
  gamaka: string;
  syllable?: string;
}

export interface SanitizedTrack {
  id: string;
  name: string;
  role: 'melody' | 'harmony' | 'bass' | 'percussion';
  instrument: string;
  volume: number;
  pan: number;
  reverbSend: number;
  muted: boolean;
  solo: boolean;
  notes: SanitizedNoteEvent[];
}

/** Clamps an arbitrary input to a valid sequencer step-cycle length (8-32, default 16). */
export function clampSteps(raw: unknown, fallback = 16): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(8, Math.min(32, Math.round(n)));
}

/** Strips control characters and truncates to `maxLen`; returns '' for non-strings. */
export function sanitizeText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLen);
}

export function getLocaleDirective(localeRaw: unknown): string {
  const locale = sanitizeText(localeRaw, 8).toLowerCase();
  if (locale === 'te') {
    return 'LANGUAGE REQUIREMENT: Write all descriptive fields (title, subtitle, performanceGuidance, sahityaOrLyrics, sourceAttributionNote, summary, rhythmicAlignment, pedagogicalDrills, directorSuggestions) primarily in idiomatic, musical Telugu script (తెలుగు), keeping technical swara codes readable.';
  }
  if (locale === 'sa') {
    return 'LANGUAGE REQUIREMENT: Write all descriptive fields (title, subtitle, performanceGuidance, sahityaOrLyrics, sourceAttributionNote, summary, rhythmicAlignment, pedagogicalDrills, directorSuggestions) primarily in classical Sanskrit Devanagari (संस्कृतम्), keeping technical swara codes readable.';
  }
  return 'LANGUAGE REQUIREMENT: Write all descriptive fields in clear, professional English.';
}

/** Normalizes a raw mime-type string to one of the canonical `VALID_AUDIO_MIMES` values. */
export function normalizeAudioMime(mimeRaw: string): string {
  if (mimeRaw === 'audio/x-m4a' || mimeRaw === 'audio/m4a') return 'audio/mp4';
  if (mimeRaw === 'audio/wave' || mimeRaw === 'audio/vnd.wave' || mimeRaw === 'audio/x-wav') {
    return 'audio/wav';
  }
  return VALID_AUDIO_MIMES.has(mimeRaw) ? mimeRaw : 'audio/webm';
}

/**
 * Clamps and whitelists an AI-generated (or client-supplied) track/notes
 * array into the shape the studio engine expects: at most 6 tracks, at most
 * 96 notes per track, percussion restricted to the 5 valid drum-lane
 * semitone offsets, melodic content clamped to -12..+24.
 */
export function sanitizeTrackNotes(rawTracks: unknown, totalSteps: number): SanitizedTrack[] {
  if (!Array.isArray(rawTracks)) return [];

  return rawTracks.slice(0, 6).map((t, idx) => {
    const tr = (t ?? {}) as Record<string, unknown>;
    const roleRaw = String(tr.role ?? 'melody');
    const role: SanitizedTrack['role'] =
      roleRaw === 'harmony' || roleRaw === 'bass' || roleRaw === 'percussion' ? roleRaw : 'melody';
    const instRaw = String(tr.instrument ?? 'piano');
    const instrument = VALID_INSTRUMENTS.has(instRaw)
      ? instRaw
      : role === 'percussion'
        ? 'mridangam'
        : role === 'bass'
          ? 'bass'
          : 'piano';

    const rawNotes = Array.isArray(tr.notes) ? tr.notes : [];
    const notes: SanitizedNoteEvent[] = rawNotes.slice(0, 96).map((n, nIdx) => {
      const nv = (n ?? {}) as Record<string, unknown>;
      const step = Math.max(0, Math.min(totalSteps - 1, Math.round(Number(nv.step ?? 0))));
      const durationSteps = Math.max(
        1,
        Math.min(totalSteps, Math.round(Number(nv.durationSteps ?? 1)))
      );
      let semitoneOffset = Math.round(Number(nv.semitoneOffset ?? 0));
      if (role === 'percussion') {
        if (!PERCUSSION_SEMITONE_OFFSETS.includes(semitoneOffset)) {
          semitoneOffset =
            PERCUSSION_SEMITONE_OFFSETS[Math.abs(semitoneOffset) % PERCUSSION_SEMITONE_OFFSETS.length];
        }
      } else {
        semitoneOffset = Math.max(-12, Math.min(24, semitoneOffset));
      }
      const velocity = Math.max(0.25, Math.min(1, Number(nv.velocity ?? 0.85)));
      const gamakaRaw = String(nv.gamaka ?? 'none');
      const gamaka = VALID_GAMAKAS.has(gamakaRaw) ? gamakaRaw : 'none';
      const syllable = typeof nv.syllable === 'string' ? sanitizeText(nv.syllable, 16) : undefined;

      return {
        id: `ai-n-${idx}-${nIdx}-${Date.now()}`,
        step,
        durationSteps,
        semitoneOffset,
        velocity,
        gamaka,
        ...(syllable ? {syllable} : {}),
      };
    });

    return {
      id: `ai-trk-${idx}-${Date.now()}`,
      name: sanitizeText(tr.name, 48) || `Track ${idx + 1}`,
      role,
      instrument,
      volume: role === 'melody' ? 0.88 : role === 'percussion' ? 0.82 : 0.62,
      pan: role === 'harmony' ? 0.2 : role === 'melody' ? -0.06 : 0,
      reverbSend: role === 'percussion' ? 0.2 : 0.42,
      muted: false,
      solo: false,
      notes,
    };
  });
}

export interface SafeAiError {
  status: number;
  error: string;
}

/** Maps a raw upstream Gemini error into a safe, non-leaky HTTP status + message. */
export function toSafeAiError(err: unknown, fallbackMessage: string): SafeAiError {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const lower = raw.toLowerCase();
  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return {status: 429, error: 'Studio generation quota temporarily reached. Please retry shortly.'};
  }
  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
    return {
      status: 503,
      error: 'Composition engine is experiencing temporary high demand. Please retry in a few seconds.',
    };
  }
  if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
    return {status: 403, error: 'Server authorization unavailable. Check configured secrets.'};
  }
  if (lower.includes('timeout') || lower.includes('aborted')) {
    return {status: 504, error: 'Composition request timed out. Please retry with a shorter prompt.'};
  }
  return {status: 502, error: fallbackMessage};
}

/** True for errors worth a short retry (upstream 5xx / transient network blips). */
export function isTransientAiError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('500') ||
    msg.includes('internal') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset')
  );
}

export function clampBpm(raw: unknown, fallback = 92): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(48, Math.min(180, Math.round(n))) : fallback;
}

export function sanitizeTanpuraFifthMode(raw: unknown): 'Pa' | 'Ma' | 'Ni' {
  return raw === 'Ma' || raw === 'Ni' ? raw : 'Pa';
}

/** Parses the `scaleSemitones` request field, defaulting to the Western major scale pitch classes. */
export function parseScaleSemitones(raw: unknown): number[] {
  return Array.isArray(raw)
    ? raw
        .slice(0, 12)
        .map((n: unknown) => Number(n))
        .filter((n: number) => Number.isFinite(n))
    : [0, 2, 4, 5, 7, 9, 11];
}
