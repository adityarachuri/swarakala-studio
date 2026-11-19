import {describe, expect, it} from 'vitest';
import {
  clampBpm,
  clampSteps,
  getLocaleDirective,
  isTransientAiError,
  normalizeAudioMime,
  parseScaleSemitones,
  sanitizeTanpuraFifthMode,
  sanitizeText,
  sanitizeTrackNotes,
  toSafeAiError,
  VALID_AUDIO_MIMES,
  VALID_GAMAKAS,
  VALID_INSTRUMENTS,
  VALID_TRADITIONS,
} from '../../shared/aiStudio';

describe('clampSteps', () => {
  it('clamps below the minimum up to 8', () => {
    expect(clampSteps(1)).toBe(8);
  });

  it('clamps above the maximum down to 32', () => {
    expect(clampSteps(999)).toBe(32);
  });

  it('rounds fractional values', () => {
    expect(clampSteps(16.6)).toBe(17);
  });

  it('falls back to the default for non-finite input', () => {
    expect(clampSteps('not-a-number')).toBe(16);
    expect(clampSteps(undefined)).toBe(16);
    expect(clampSteps(NaN, 24)).toBe(24);
  });

  it('passes through an in-range integer unchanged', () => {
    expect(clampSteps(20)).toBe(20);
  });
});

describe('clampBpm', () => {
  it('clamps below 48 up to 48', () => {
    expect(clampBpm(10)).toBe(48);
  });

  it('clamps above 180 down to 180', () => {
    expect(clampBpm(500)).toBe(180);
  });

  it('falls back to 92 for non-finite input', () => {
    expect(clampBpm('fast')).toBe(92);
  });

  it('respects a custom fallback', () => {
    expect(clampBpm(undefined, 100)).toBe(100);
  });

  it('rounds fractional tempos', () => {
    expect(clampBpm(120.4)).toBe(120);
  });
});

describe('sanitizeText', () => {
  it('returns an empty string for non-string input', () => {
    expect(sanitizeText(42, 10)).toBe('');
    expect(sanitizeText(null, 10)).toBe('');
    expect(sanitizeText(undefined, 10)).toBe('');
    expect(sanitizeText({}, 10)).toBe('');
  });

  it('strips control characters', () => {
    expect(sanitizeText('hello\u0000world\u007F', 20)).toBe('hello world');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeText('  padded  ', 20)).toBe('padded');
  });

  it('truncates to maxLen', () => {
    expect(sanitizeText('abcdefghij', 4)).toBe('abcd');
  });

  it('round-trips a clean short string unchanged', () => {
    expect(sanitizeText('Carnatic Raga', 40)).toBe('Carnatic Raga');
  });
});

describe('getLocaleDirective', () => {
  it('returns the Telugu directive for "te"', () => {
    expect(getLocaleDirective('te')).toContain('Telugu');
  });

  it('returns the Sanskrit directive for "sa"', () => {
    expect(getLocaleDirective('sa')).toContain('Sanskrit');
  });

  it('defaults to English for any other locale', () => {
    expect(getLocaleDirective('en')).toContain('English');
    expect(getLocaleDirective('fr')).toContain('English');
    expect(getLocaleDirective(undefined)).toContain('English');
  });
});

describe('normalizeAudioMime', () => {
  it('normalizes m4a variants to audio/mp4', () => {
    expect(normalizeAudioMime('audio/x-m4a')).toBe('audio/mp4');
    expect(normalizeAudioMime('audio/m4a')).toBe('audio/mp4');
  });

  it('normalizes wave variants to audio/wav', () => {
    expect(normalizeAudioMime('audio/wave')).toBe('audio/wav');
    expect(normalizeAudioMime('audio/vnd.wave')).toBe('audio/wav');
    expect(normalizeAudioMime('audio/x-wav')).toBe('audio/wav');
  });

  it('passes through an already-valid mime type', () => {
    expect(normalizeAudioMime('audio/webm')).toBe('audio/webm');
    expect(normalizeAudioMime('audio/flac')).toBe('audio/flac');
  });

  it('falls back to audio/webm for unknown types', () => {
    expect(normalizeAudioMime('audio/bogus')).toBe('audio/webm');
    expect(normalizeAudioMime('')).toBe('audio/webm');
  });
});

describe('parseScaleSemitones', () => {
  it('defaults to the Western major scale for non-array input', () => {
    expect(parseScaleSemitones(undefined)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(parseScaleSemitones('nope')).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('filters out non-finite entries', () => {
    expect(parseScaleSemitones([0, 'x', 4, NaN, 7])).toEqual([0, 4, 7]);
  });

  it('truncates to at most 12 entries', () => {
    const input = Array.from({length: 20}, (_, i) => i);
    expect(parseScaleSemitones(input)).toHaveLength(12);
  });
});

describe('sanitizeTanpuraFifthMode', () => {
  it('accepts Ma and Ni', () => {
    expect(sanitizeTanpuraFifthMode('Ma')).toBe('Ma');
    expect(sanitizeTanpuraFifthMode('Ni')).toBe('Ni');
  });

  it('defaults anything else to Pa', () => {
    expect(sanitizeTanpuraFifthMode('Pa')).toBe('Pa');
    expect(sanitizeTanpuraFifthMode('bogus')).toBe('Pa');
    expect(sanitizeTanpuraFifthMode(undefined)).toBe('Pa');
  });
});

describe('isTransientAiError', () => {
  it('flags known-transient upstream errors', () => {
    expect(isTransientAiError(new Error('503 Service Unavailable'))).toBe(true);
    expect(isTransientAiError(new Error('model is in high demand'))).toBe(true);
    expect(isTransientAiError(new Error('Internal Server Error 500'))).toBe(true);
    expect(isTransientAiError(new Error('fetch failed'))).toBe(true);
    expect(isTransientAiError(new Error('ECONNRESET'))).toBe(true);
  });

  it('does not flag non-transient errors', () => {
    expect(isTransientAiError(new Error('403 permission_denied'))).toBe(false);
    expect(isTransientAiError(new Error('bad request'))).toBe(false);
  });
});

describe('toSafeAiError', () => {
  it('maps quota/429 errors to 429', () => {
    expect(toSafeAiError(new Error('429 RESOURCE_EXHAUSTED'), 'fallback').status).toBe(429);
  });

  it('maps unavailable/503 errors to 503', () => {
    expect(toSafeAiError(new Error('503 UNAVAILABLE'), 'fallback').status).toBe(503);
  });

  it('maps permission/403 errors to 403', () => {
    expect(toSafeAiError(new Error('403 PERMISSION_DENIED'), 'fallback').status).toBe(403);
  });

  it('maps timeout/aborted errors to 504', () => {
    expect(toSafeAiError(new Error('request timeout'), 'fallback').status).toBe(504);
    expect(toSafeAiError(new Error('aborted'), 'fallback').status).toBe(504);
  });

  it('falls back to 502 with the given message for unknown errors', () => {
    const result = toSafeAiError(new Error('something unexpected'), 'fallback message');
    expect(result).toEqual({status: 502, error: 'fallback message'});
  });

  it('handles non-Error throwables', () => {
    expect(toSafeAiError('plain string 503', 'fallback').status).toBe(503);
    expect(toSafeAiError(undefined, 'fallback').status).toBe(502);
  });
});

describe('sanitizeTrackNotes', () => {
  it('returns an empty array for non-array input', () => {
    expect(sanitizeTrackNotes(undefined, 16)).toEqual([]);
    expect(sanitizeTrackNotes('nope', 16)).toEqual([]);
    expect(sanitizeTrackNotes(null, 16)).toEqual([]);
  });

  it('caps the number of tracks at 6', () => {
    const rawTracks = Array.from({length: 10}, (_, i) => ({
      name: `Track ${i}`,
      role: 'melody',
      instrument: 'piano',
      notes: [],
    }));
    expect(sanitizeTrackNotes(rawTracks, 16)).toHaveLength(6);
  });

  it('caps notes per track at 96', () => {
    const notes = Array.from({length: 200}, (_, i) => ({step: i % 16, durationSteps: 1, semitoneOffset: 0, velocity: 0.8, gamaka: 'none'}));
    const [track] = sanitizeTrackNotes([{name: 'T', role: 'melody', instrument: 'piano', notes}], 16);
    expect(track.notes).toHaveLength(96);
  });

  it('defaults an unrecognized role to melody', () => {
    const [track] = sanitizeTrackNotes([{role: 'bogus', notes: []}], 16);
    expect(track.role).toBe('melody');
  });

  it('accepts the valid non-melody roles', () => {
    const roles = sanitizeTrackNotes(
      [
        {role: 'harmony', notes: []},
        {role: 'bass', notes: []},
        {role: 'percussion', notes: []},
      ],
      16
    ).map((t) => t.role);
    expect(roles).toEqual(['harmony', 'bass', 'percussion']);
  });

  it('falls back instrument choice by role when instrument is invalid', () => {
    const [melody] = sanitizeTrackNotes([{role: 'melody', instrument: 'kazoo', notes: []}], 16);
    expect(melody.instrument).toBe('piano');
    const [bass] = sanitizeTrackNotes([{role: 'bass', instrument: 'kazoo', notes: []}], 16);
    expect(bass.instrument).toBe('bass');
    const [perc] = sanitizeTrackNotes([{role: 'percussion', instrument: 'kazoo', notes: []}], 16);
    expect(perc.instrument).toBe('mridangam');
  });

  it('accepts every whitelisted instrument unchanged', () => {
    for (const inst of VALID_INSTRUMENTS) {
      const [track] = sanitizeTrackNotes([{role: 'melody', instrument: inst, notes: []}], 16);
      expect(track.instrument).toBe(inst);
    }
  });

  it('defaults a missing track name to "Track N" (1-indexed)', () => {
    const tracks = sanitizeTrackNotes([{role: 'melody', notes: []}, {role: 'melody', notes: []}], 16);
    expect(tracks[0].name).toBe('Track 1');
    expect(tracks[1].name).toBe('Track 2');
  });

  it('clamps note step into [0, totalSteps - 1]', () => {
    const [track] = sanitizeTrackNotes(
      [{role: 'melody', notes: [{step: -5}, {step: 999}]}],
      16
    );
    expect(track.notes[0].step).toBe(0);
    expect(track.notes[1].step).toBe(15);
  });

  it('clamps note durationSteps into [1, totalSteps]', () => {
    const [track] = sanitizeTrackNotes(
      [{role: 'melody', notes: [{step: 0, durationSteps: 0}, {step: 0, durationSteps: 999}]}],
      16
    );
    expect(track.notes[0].durationSteps).toBe(1);
    expect(track.notes[1].durationSteps).toBe(16);
  });

  it('clamps melodic semitoneOffset into [-12, 24]', () => {
    const [track] = sanitizeTrackNotes(
      [{role: 'melody', notes: [{step: 0, semitoneOffset: -99}, {step: 0, semitoneOffset: 99}]}],
      16
    );
    expect(track.notes[0].semitoneOffset).toBe(-12);
    expect(track.notes[1].semitoneOffset).toBe(24);
  });

  it('restricts percussion semitoneOffset to the 5 valid drum lanes', () => {
    const [track] = sanitizeTrackNotes(
      [{role: 'percussion', notes: [{step: 0, semitoneOffset: 3}, {step: 0, semitoneOffset: 0}]}],
      16
    );
    for (const note of track.notes) {
      expect([0, 2, 4, 5, 7]).toContain(note.semitoneOffset);
    }
  });

  it('leaves a valid percussion semitoneOffset untouched', () => {
    const [track] = sanitizeTrackNotes([{role: 'percussion', notes: [{step: 0, semitoneOffset: 7}]}], 16);
    expect(track.notes[0].semitoneOffset).toBe(7);
  });

  it('clamps velocity into [0.25, 1]', () => {
    const [track] = sanitizeTrackNotes(
      [{role: 'melody', notes: [{step: 0, velocity: -1}, {step: 0, velocity: 5}]}],
      16
    );
    expect(track.notes[0].velocity).toBe(0.25);
    expect(track.notes[1].velocity).toBe(1);
  });

  it('defaults an invalid gamaka to "none"', () => {
    const [track] = sanitizeTrackNotes([{role: 'melody', notes: [{step: 0, gamaka: 'bogus'}]}], 16);
    expect(track.notes[0].gamaka).toBe('none');
  });

  it('accepts every whitelisted gamaka unchanged', () => {
    for (const g of VALID_GAMAKAS) {
      const [track] = sanitizeTrackNotes([{role: 'melody', notes: [{step: 0, gamaka: g}]}], 16);
      expect(track.notes[0].gamaka).toBe(g);
    }
  });

  it('includes syllable only when it is a non-empty string', () => {
    const [withSyl] = sanitizeTrackNotes([{role: 'melody', notes: [{step: 0, syllable: 'Sa'}]}], 16);
    expect(withSyl.notes[0].syllable).toBe('Sa');
    const [withoutSyl] = sanitizeTrackNotes([{role: 'melody', notes: [{step: 0}]}], 16);
    expect(withoutSyl.notes[0].syllable).toBeUndefined();
  });

  it('tolerates malformed/null track and note entries without throwing', () => {
    expect(() => sanitizeTrackNotes([null, undefined, {role: 'melody', notes: [null, undefined]}], 16)).not.toThrow();
  });
});

describe('cross-checked constant sets stay consistent with each other', () => {
  it('VALID_TRADITIONS has the three supported traditions', () => {
    expect(VALID_TRADITIONS).toEqual(new Set(['carnatic', 'hindustani', 'western']));
  });

  it('VALID_AUDIO_MIMES includes every format advertised in the transcription error message', () => {
    for (const mime of ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/aac', 'audio/flac']) {
      expect(VALID_AUDIO_MIMES.has(mime)).toBe(true);
    }
  });
});
