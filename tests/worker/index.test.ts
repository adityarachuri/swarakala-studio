import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import worker, {type Env} from '../../worker/index';

function geminiSuccessResponse(payload: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      candidates: [{content: {parts: [{text: JSON.stringify(payload)}]}}],
    }),
    {status: 200}
  );
}

const baseEnv: Env = {GEMINI_API_KEY: 'test-key-123'};

describe('worker fetch handler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('GET /api/studio/health', () => {
    it('reports aiReady=true when GEMINI_API_KEY is set', async () => {
      const res = await worker.fetch(new Request('https://example.com/api/studio/health'), baseEnv);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({status: 'ok', aiReady: true, runtime: 'cloudflare-workers'});
    });

    it('reports aiReady=false when GEMINI_API_KEY is missing', async () => {
      const res = await worker.fetch(new Request('https://example.com/api/studio/health'), {});
      expect((await res.json()).aiReady).toBe(false);
    });

    it('applies the shared security headers', async () => {
      const res = await worker.fetch(new Request('https://example.com/api/studio/health'), baseEnv);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });
  });

  describe('POST /api/studio/* without a configured secret', () => {
    it('returns 503 when GEMINI_API_KEY is not configured', async () => {
      const req = new Request('https://example.com/api/studio/compose', {
        method: 'POST',
        body: JSON.stringify({prompt: 'x', tradition: 'western'}),
      });
      const res = await worker.fetch(req, {});
      expect(res.status).toBe(503);
    });
  });

  describe('POST /api/studio/compose', () => {
    it('rejects malformed JSON bodies with 400', async () => {
      const req = new Request('https://example.com/api/studio/compose', {
        method: 'POST',
        body: '{not valid json',
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/malformed/i);
    });

    it('rejects a missing prompt / invalid tradition with 400', async () => {
      const req = new Request('https://example.com/api/studio/compose', {
        method: 'POST',
        body: JSON.stringify({prompt: '', tradition: 'bogus'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(400);
    });

    it('returns a sanitized, 200 composition on a successful upstream Gemini call', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          geminiSuccessResponse({
            title: 'Dawn Raga',
            subtitle: 'Carnatic · Mayamalavagowla',
            bpm: 90,
            tanpuraFifthMode: 'Pa',
            tracks: [{name: 'Melody', role: 'melody', instrument: 'veena', notes: []}],
            pedagogy: {
              chordProgression: '',
              performanceGuidance: '',
              sahityaOrLyrics: '',
              solkattuOrBol: '',
              sourceAttributionNote: 'Original studio composition.',
            },
          })
        )
      );

      const req = new Request('https://example.com/api/studio/compose', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A dawn raga alap',
          tradition: 'carnatic',
          scaleName: 'Mayamalavagowla',
          scaleSemitones: [0, 1, 4, 5, 7, 8, 11],
          talaName: 'Adi',
          totalSteps: 16,
        }),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe('Dawn Raga');
      expect(body.bpm).toBe(90);
      expect(body.tracks).toHaveLength(1);
      expect(body.tracks[0].instrument).toBe('veena');
    });

    it('maps an upstream 503 into a safe 503 JSON error without leaking internals', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('upstream overloaded', {status: 503}))
      );
      const req = new Request('https://example.com/api/studio/compose', {
        method: 'POST',
        body: JSON.stringify({prompt: 'x', tradition: 'western'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).not.toContain('upstream overloaded');
    });
  });

  describe('POST /api/studio/variation', () => {
    it('rejects a missing instruction with 400', async () => {
      const req = new Request('https://example.com/api/studio/variation', {
        method: 'POST',
        body: JSON.stringify({instruction: ''}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(400);
    });

    it('returns a sanitized variation on a successful upstream call', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          geminiSuccessResponse({
            title: 'Variation',
            subtitle: 'Sub',
            bpm: 110,
            tracks: [{name: 'Melody', role: 'melody', instrument: 'sitar', notes: []}],
            pedagogy: {},
          })
        )
      );
      const req = new Request('https://example.com/api/studio/variation', {
        method: 'POST',
        body: JSON.stringify({instruction: 'Make it faster', tradition: 'hindustani', tracks: []}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.bpm).toBe(110);
      expect(body.tracks[0].instrument).toBe('sitar');
    });
  });

  describe('POST /api/studio/analyze', () => {
    it('returns the parsed analysis payload from a successful upstream call', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          geminiSuccessResponse({
            summary: 'Mostly in-scale',
            scaleAdherencePercent: 92,
            outOfScaleNotes: [],
            rhythmicAlignment: 'Aligned to Sam',
            pedagogicalDrills: [],
            directorSuggestions: [],
          })
        )
      );
      const req = new Request('https://example.com/api/studio/analyze', {
        method: 'POST',
        body: JSON.stringify({tradition: 'carnatic', scaleName: 'Mayamalavagowla', talaName: 'Adi', melodyNotes: []}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(200);
      expect((await res.json()).scaleAdherencePercent).toBe(92);
    });

    it('maps an upstream failure into a safe error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('403 PERMISSION_DENIED')));
      const req = new Request('https://example.com/api/studio/analyze', {
        method: 'POST',
        body: JSON.stringify({tradition: 'carnatic'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/studio/transcribe', () => {
    it('rejects an unsupported mime type with 400', async () => {
      const req = new Request('https://example.com/api/studio/transcribe', {
        method: 'POST',
        body: JSON.stringify({audioBase64: 'abc', mimeType: 'video/mp4'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(400);
    });

    it('rejects a missing audioBase64 with 400', async () => {
      const req = new Request('https://example.com/api/studio/transcribe', {
        method: 'POST',
        body: JSON.stringify({audioBase64: '', mimeType: 'audio/wav'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(400);
    });

    it('returns a transcript on a successful upstream call', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({candidates: [{content: {parts: [{text: 'Sa Ri Ga Ma'}]}}]}),
            {status: 200}
          )
        )
      );
      const req = new Request('https://example.com/api/studio/transcribe', {
        method: 'POST',
        body: JSON.stringify({audioBase64: 'ZmFrZS1hdWRpby1ieXRlcw==', mimeType: 'audio/wav'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(200);
      expect((await res.json()).transcript).toBe('Sa Ri Ga Ma');
    });

    it('falls back to the secondary model when the primary transcription model 404s', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response('not found', {status: 404}))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({candidates: [{content: {parts: [{text: 'fallback transcript'}]}}]}), {
            status: 200,
          })
        );
      vi.stubGlobal('fetch', fetchMock);
      const req = new Request('https://example.com/api/studio/transcribe', {
        method: 'POST',
        body: JSON.stringify({audioBase64: 'ZmFrZQ==', mimeType: 'audio/wav'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(200);
      expect((await res.json()).transcript).toBe('fallback transcript');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('request size limits', () => {
    it('rejects an oversized compose payload via Content-Length with 413', async () => {
      const req = new Request('https://example.com/api/studio/compose', {
        method: 'POST',
        headers: {'content-length': String(300_000)},
        body: JSON.stringify({prompt: 'x'.repeat(1000), tradition: 'western'}),
      });
      const res = await worker.fetch(req, baseEnv);
      expect(res.status).toBe(413);
    });
  });

  describe('unmatched routes', () => {
    it('returns 404 for an unknown path with no ASSETS binding', async () => {
      const res = await worker.fetch(new Request('https://example.com/nope'), baseEnv);
      expect(res.status).toBe(404);
    });

    it('falls through to env.ASSETS.fetch when bound', async () => {
      const assetResponse = new Response('<html></html>', {
        status: 200,
        headers: {'Content-Type': 'text/html'},
      });
      const env: Env = {
        ...baseEnv,
        ASSETS: {fetch: vi.fn().mockResolvedValue(assetResponse)},
      };
      const res = await worker.fetch(new Request('https://example.com/index.html'), env);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });
});
