import {describe, expect, it} from 'vitest';
import {MELAKARTA_72} from '../../src/data/musicLiterature';
import {
  applySangatiVariation,
  createScaleFromMelakarta,
  createTalaFromSuladi,
  generateChordStampNotes,
  generateTihaiCadence,
  formatPitchLabel,
  getFrequencyHz,
  getMidiNoteName,
  getQuantizeIntervalSteps,
  getScaleById,
  getScaleDisplayName,
  getShrutiCentsOffset,
  getSwaraName,
  getTalaById,
  getTalaDisplayName,
  getTalaStructureDisplay,
  isSemitoneInScale,
  parseSwaraPhraseToNotes,
  quantizeTrackNotes,
  SCALES_AND_RAGAS,
  snapStepToQuantizeGrid,
  TALAS_AND_METERS,
  WESTERN_NOTE_NAMES,
} from '../../src/engine/musicTheory';
import type {NoteEvent, ScaleDefinition, TalaDefinition} from '../../src/types/studio';

const mayamalavagowla = getScaleById('mayamalavagowla');
const adiTala = getTalaById('adi_tala');

describe('SCALES_AND_RAGAS data integrity', () => {
  it('has unique ids', () => {
    const ids = SCALES_AND_RAGAS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every scale has at least one semitone and all semitones are valid pitch classes 0-11', () => {
    for (const scale of SCALES_AND_RAGAS) {
      expect(scale.semitones.length).toBeGreaterThan(0);
      for (const semi of scale.semitones) {
        expect(semi).toBeGreaterThanOrEqual(0);
        expect(semi).toBeLessThanOrEqual(11);
      }
    }
  });

  it('every scale includes the tonic (Sa / pitch class 0)', () => {
    for (const scale of SCALES_AND_RAGAS) {
      expect(scale.semitones).toContain(0);
    }
  });
});

describe('TALAS_AND_METERS data integrity', () => {
  it('has unique ids', () => {
    const ids = TALAS_AND_METERS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('totalSteps equals beats * stepsPerBeat for every tala', () => {
    for (const tala of TALAS_AND_METERS) {
      expect(tala.totalSteps).toBe(tala.beats * tala.stepsPerBeat);
    }
  });

  it('vibhags sum to the beat count', () => {
    for (const tala of TALAS_AND_METERS) {
      expect(tala.vibhags.reduce((a, b) => a + b, 0)).toBe(tala.beats);
    }
  });
});

describe('getScaleById / getTalaById', () => {
  it('returns the matching static scale', () => {
    expect(mayamalavagowla.id).toBe('mayamalavagowla');
  });

  it('falls back to the first scale for an unknown id', () => {
    expect(getScaleById('does-not-exist')).toBe(SCALES_AND_RAGAS[0]);
  });

  it('synthesizes a melakarta scale on demand', () => {
    const scale = getScaleById('melakarta_1');
    expect(scale.id).toBe('melakarta_1');
    expect(scale.melakartaNumber).toBe(1);
  });

  it('returns the matching static tala', () => {
    expect(adiTala.id).toBe('adi_tala');
  });

  it('falls back to the first tala for an unknown id', () => {
    expect(getTalaById('does-not-exist')).toBe(TALAS_AND_METERS[0]);
  });

  it('synthesizes a suladi tala on demand', () => {
    const tala = getTalaById('suladi_triputa_chatusra');
    expect(tala.id).toBe('suladi_triputa_chatusra');
  });
});

describe('createScaleFromMelakarta', () => {
  it('produces a scale carrying the melakarta number and its semitones', () => {
    const entry = MELAKARTA_72[14]; // Mela 15
    const scale = createScaleFromMelakarta(entry);
    expect(scale.melakartaNumber).toBe(entry.number);
    expect(scale.semitones).toEqual(entry.semitones);
    expect(scale.tradition).toBe('carnatic');
  });

  it('produces a distinct scale object per melakarta entry (no shared semitones array)', () => {
    const entry = MELAKARTA_72[0];
    const scale = createScaleFromMelakarta(entry);
    scale.semitones.push(999);
    expect(entry.semitones).not.toContain(999);
  });
});

describe('createTalaFromSuladi', () => {
  it('computes totalSteps as beats * stepsPerBeat', () => {
    const tala = createTalaFromSuladi('triputa', 'chatusra');
    expect(tala.totalSteps).toBe(tala.beats * tala.stepsPerBeat);
  });

  it('falls back to defaults for an unknown talaId/jatiId', () => {
    expect(() => createTalaFromSuladi('bogus-tala', 'bogus-jati' as never)).not.toThrow();
  });
});

describe('getScaleDisplayName / getTalaDisplayName / getTalaStructureDisplay', () => {
  it('returns the Telugu name when locale is te and available', () => {
    expect(getScaleDisplayName(mayamalavagowla, 'te')).toBe(mayamalavagowla.nameTe);
  });

  it('returns the Sanskrit name when locale is sa and available', () => {
    expect(getScaleDisplayName(mayamalavagowla, 'sa')).toBe(mayamalavagowla.nameSa);
  });

  it('falls back to the English name when the locale variant is missing', () => {
    const bare: ScaleDefinition = {...mayamalavagowla, nameTe: undefined, nameSa: undefined};
    expect(getScaleDisplayName(bare, 'te')).toBe(bare.name);
    expect(getScaleDisplayName(bare, 'sa')).toBe(bare.name);
  });

  it('getTalaDisplayName mirrors the same locale-fallback behavior', () => {
    expect(getTalaDisplayName(adiTala, 'en')).toBe(adiTala.name);
  });

  it('getTalaStructureDisplay mirrors the same locale-fallback behavior', () => {
    expect(getTalaStructureDisplay(adiTala, 'en')).toBe(adiTala.structureLabel);
  });
});

describe('getMidiNoteName', () => {
  it('maps MIDI 60 to C4', () => {
    expect(getMidiNoteName(60)).toBe('C4');
  });

  it('maps MIDI 69 to A4', () => {
    expect(getMidiNoteName(69)).toBe('A4');
  });

  it('handles negative MIDI numbers by wrapping the pitch class', () => {
    expect(getMidiNoteName(-1)).toBe(`${WESTERN_NOTE_NAMES[11]}-2`);
  });
});

describe('getSwaraName', () => {
  it('returns the Carnatic tonic label for semitone 0', () => {
    expect(getSwaraName(0, 'carnatic').base).toBe('S');
  });

  it('returns a Hindustani label distinct from Carnatic for a non-tonic degree', () => {
    const carnatic = getSwaraName(1, 'carnatic');
    const hindustani = getSwaraName(1, 'hindustani');
    expect(carnatic.base).not.toBe(hindustani.base);
  });
});

describe('formatPitchLabel', () => {
  it('returns only the Western label in western mode', () => {
    expect(formatPitchLabel(0, 60, 'carnatic', 'western')).toBe(getMidiNoteName(60));
  });

  it('returns only the swara label in swara mode', () => {
    expect(formatPitchLabel(0, 60, 'carnatic', 'swara')).toBe('S');
  });

  it('combines both labels in both mode', () => {
    const label = formatPitchLabel(0, 60, 'carnatic', 'both');
    expect(label).toContain('S');
    expect(label).toContain(getMidiNoteName(60));
    expect(label).toContain('·');
  });
});

describe('isSemitoneInScale', () => {
  it('is true for the tonic of any scale', () => {
    expect(isSemitoneInScale(0, mayamalavagowla)).toBe(true);
  });

  it('wraps octaves via modulo 12', () => {
    expect(isSemitoneInScale(12, mayamalavagowla)).toBe(true);
    expect(isSemitoneInScale(-12, mayamalavagowla)).toBe(true);
  });

  it('is false for a pitch class absent from the scale', () => {
    // Mayamalavagowla = [0,1,4,5,7,8,11] — 2, 3, 6, 9, 10 are absent
    expect(isSemitoneInScale(2, mayamalavagowla)).toBe(false);
  });

  it('checks avarohanaSemitones when provided', () => {
    const vakra: ScaleDefinition = {...mayamalavagowla, semitones: [0, 4, 7], avarohanaSemitones: [0, 2, 4, 7]};
    expect(isSemitoneInScale(2, vakra)).toBe(true);
  });
});

describe('getShrutiCentsOffset / getFrequencyHz', () => {
  it('returns 0 cents offset when microtonal is disabled', () => {
    expect(getShrutiCentsOffset(1, mayamalavagowla, false)).toBe(0);
  });

  it('returns the scale-specific cents offset when microtonal is enabled', () => {
    expect(getShrutiCentsOffset(1, mayamalavagowla, true)).toBe(mayamalavagowla.shrutiCents[1]);
  });

  it('computes A4 = 440Hz at MIDI 69 with no microtonal offset', () => {
    const hz = getFrequencyHz(0, 69, 440, false, mayamalavagowla);
    expect(hz).toBeCloseTo(440, 5);
  });

  it('computes one octave up as exactly double the frequency', () => {
    const base = getFrequencyHz(0, 60, 440, false, mayamalavagowla);
    const octaveUp = getFrequencyHz(12, 60, 440, false, mayamalavagowla);
    expect(octaveUp).toBeCloseTo(base * 2, 5);
  });

  it('applies microtonal cents as a frequency deviation', () => {
    const without = getFrequencyHz(1, 60, 440, false, mayamalavagowla);
    const withMicrotonal = getFrequencyHz(1, 60, 440, true, mayamalavagowla);
    expect(withMicrotonal).not.toBeCloseTo(without, 5);
  });
});

describe('getQuantizeIntervalSteps', () => {
  it('returns a smaller interval for finer divisions', () => {
    const half = getQuantizeIntervalSteps('1/2', adiTala);
    const quarter = getQuantizeIntervalSteps('1/4', adiTala);
    const eighth = getQuantizeIntervalSteps('1/8', adiTala);
    expect(half).toBeGreaterThanOrEqual(quarter);
    expect(quarter).toBeGreaterThanOrEqual(eighth);
  });

  it('never returns less than 1 or more than totalSteps', () => {
    for (const division of ['1/2', '1/4', '1/8'] as const) {
      const interval = getQuantizeIntervalSteps(division, adiTala);
      expect(interval).toBeGreaterThanOrEqual(1);
      expect(interval).toBeLessThanOrEqual(adiTala.totalSteps);
    }
  });
});

describe('snapStepToQuantizeGrid', () => {
  it('snaps to the nearest grid line', () => {
    expect(snapStepToQuantizeGrid(3, 4, 16)).toBe(4);
    expect(snapStepToQuantizeGrid(1, 4, 16)).toBe(0);
  });

  it('wraps around the end of the cycle to the nearest grid line', () => {
    // 15 is closer to 16%16=0 than to 12
    expect(snapStepToQuantizeGrid(15, 4, 16)).toBe(0);
  });

  it('returns 0 for a non-positive totalSteps', () => {
    expect(snapStepToQuantizeGrid(5, 4, 0)).toBe(0);
  });

  it('with interval <= 1, rounds and wraps without snapping to a coarser grid', () => {
    expect(snapStepToQuantizeGrid(16, 1, 16)).toBe(0);
    expect(snapStepToQuantizeGrid(-1, 1, 16)).toBe(15);
  });
});

describe('quantizeTrackNotes', () => {
  const makeNote = (overrides: Partial<NoteEvent>): NoteEvent => ({
    id: Math.random().toString(36),
    step: 0,
    durationSteps: 1,
    semitoneOffset: 0,
    velocity: 0.8,
    gamaka: 'none',
    ...overrides,
  });

  it('limits quantization to recorded notes when any are recorded', () => {
    const recorded = makeNote({step: 3, rawStep: 3, recorded: true});
    const unrecorded = makeNote({step: 5, semitoneOffset: 2});
    const result = quantizeTrackNotes([recorded, unrecorded], '1/4', adiTala);
    expect(result.scope).toBe('recorded');
    const kept = result.notes.find((n) => n.semitoneOffset === 2);
    expect(kept?.step).toBe(5); // untouched
  });

  it('quantizes all notes when none are marked recorded', () => {
    const a = makeNote({step: 3, rawStep: 3});
    const result = quantizeTrackNotes([a], '1/4', adiTala);
    expect(result.scope).toBe('all');
  });

  it('deduplicates notes landing on the same step+pitch, keeping the higher velocity', () => {
    const quiet = makeNote({step: 0, rawStep: 0, velocity: 0.3});
    const loud = makeNote({step: 0, rawStep: 0, velocity: 0.9});
    const result = quantizeTrackNotes([quiet, loud], '1/4', adiTala, false);
    const matching = result.notes.filter((n) => n.step === 0 && n.semitoneOffset === 0);
    expect(matching).toHaveLength(1);
    expect(matching[0].velocity).toBe(0.9);
  });

  it('clamps durationSteps so a note never extends past the end of the cycle', () => {
    const note = makeNote({step: adiTala.totalSteps - 2, rawStep: adiTala.totalSteps - 2, durationSteps: 10});
    const result = quantizeTrackNotes([note], '1/4', adiTala, false);
    const out = result.notes[0];
    expect(out.step + out.durationSteps).toBeLessThanOrEqual(adiTala.totalSteps);
  });

  it('returns notes sorted by step', () => {
    const notes = [makeNote({step: 10, rawStep: 10}), makeNote({step: 2, rawStep: 2, semitoneOffset: 4})];
    const result = quantizeTrackNotes(notes, '1/4', adiTala, false);
    const steps = result.notes.map((n) => n.step);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });
});

describe('parseSwaraPhraseToNotes', () => {
  it('returns an empty array for blank input', () => {
    expect(parseSwaraPhraseToNotes('   ', mayamalavagowla, 16)).toEqual([]);
  });

  it('parses a simple Sa Ri Ga Ma Pa phrase into sequential steps', () => {
    const notes = parseSwaraPhraseToNotes('S R G M P', mayamalavagowla, 16);
    expect(notes.map((n) => n.step)).toEqual([0, 1, 2, 3, 4]);
    expect(notes[0].semitoneOffset).toBe(0); // S
    expect(notes[4].semitoneOffset).toBe(7); // P
  });

  it('extends the previous note duration on a rest/sustain token', () => {
    const notes = parseSwaraPhraseToNotes('S - -', mayamalavagowla, 16);
    expect(notes).toHaveLength(1);
    expect(notes[0].durationSteps).toBe(3);
  });

  it('applies +12 for an upper-octave marker and -12 for a lower-octave marker', () => {
    const notes = parseSwaraPhraseToNotes("S' S,", mayamalavagowla, 16);
    expect(notes[0].semitoneOffset).toBe(12);
    expect(notes[1].semitoneOffset).toBe(0 - 12);
  });

  it('stops once the cursor reaches totalSteps', () => {
    const notes = parseSwaraPhraseToNotes('S R G M P D N S', mayamalavagowla, 4);
    expect(notes.every((n) => n.step < 4)).toBe(true);
  });

  it('ignores tokens it cannot recognize', () => {
    const notes = parseSwaraPhraseToNotes('S ??? P', mayamalavagowla, 16);
    expect(notes.map((n) => n.semitoneOffset)).toEqual([0, 7]);
  });
});

describe('generateTihaiCadence', () => {
  it('produces 3 repetitions of a 4-step motif (12 notes)', () => {
    const notes = generateTihaiCadence(mayamalavagowla, adiTala, false);
    expect(notes).toHaveLength(12);
  });

  it('uses the fixed percussion motif pitch classes when isPercussion is true', () => {
    const notes = generateTihaiCadence(mayamalavagowla, adiTala, true);
    const pitchClasses = new Set(notes.map((n) => n.semitoneOffset));
    for (const pc of pitchClasses) {
      expect([0, 2, 4, 7]).toContain(pc);
    }
  });

  it('every step index is within the tala cycle', () => {
    const notes = generateTihaiCadence(mayamalavagowla, adiTala, false);
    for (const n of notes) {
      expect(n.step).toBeGreaterThanOrEqual(0);
      expect(n.step).toBeLessThan(Math.max(8, adiTala.totalSteps));
    }
  });
});

describe('applySangatiVariation', () => {
  it('splits a sustained note (durationSteps >= 2) into a twin-swara ornament', () => {
    const notes: NoteEvent[] = [
      {id: 'a', step: 0, durationSteps: 2, semitoneOffset: 0, velocity: 0.8, gamaka: 'none'},
    ];
    const out = applySangatiVariation(notes, mayamalavagowla, adiTala);
    expect(out).toHaveLength(2);
    expect(out[0].durationSteps).toBe(1);
    expect(out[0].gamaka).toBe('kampita');
    expect(out[1].gamaka).toBe('sphurita');
  });

  it('leaves a short note (durationSteps 1) as a single note with escalated gamaka', () => {
    const notes: NoteEvent[] = [
      {id: 'a', step: 0, durationSteps: 1, semitoneOffset: 0, velocity: 0.8, gamaka: 'none'},
    ];
    const out = applySangatiVariation(notes, mayamalavagowla, adiTala);
    expect(out).toHaveLength(1);
    expect(out[0].gamaka).toBe('kampita');
  });

  it('escalates an existing kampita gamaka to sphurita rather than overwriting other gamakas', () => {
    const notes: NoteEvent[] = [
      {id: 'a', step: 0, durationSteps: 1, semitoneOffset: 0, velocity: 0.8, gamaka: 'kampita'},
      {id: 'b', step: 1, durationSteps: 1, semitoneOffset: 0, velocity: 0.8, gamaka: 'meend'},
    ];
    const out = applySangatiVariation(notes, mayamalavagowla, adiTala);
    expect(out[0].gamaka).toBe('sphurita');
    expect(out[1].gamaka).toBe('meend');
  });

  it('does not split a sustained note landing on the last step of the cycle', () => {
    const notes: NoteEvent[] = [
      {id: 'a', step: adiTala.totalSteps - 1, durationSteps: 4, semitoneOffset: 0, velocity: 0.8, gamaka: 'none'},
    ];
    const out = applySangatiVariation(notes, mayamalavagowla, adiTala);
    expect(out).toHaveLength(1);
  });
});

describe('generateChordStampNotes', () => {
  it('triad_root produces a 3-note chord', () => {
    const notes = generateChordStampNotes('triad_root', mayamalavagowla, 0, 4);
    expect(notes).toHaveLength(3);
    expect(notes.every((n) => n.step === 0 && n.durationSteps === 4)).toBe(true);
  });

  it('maj7_lydian produces a 4-note chord', () => {
    expect(generateChordStampNotes('maj7_lydian', mayamalavagowla, 0, 4)).toHaveLength(4);
  });

  it('sus2_modal produces a 4-note chord including an octave-up root', () => {
    const notes = generateChordStampNotes('sus2_modal', mayamalavagowla, 0, 4);
    expect(notes).toHaveLength(4);
    expect(notes[3].semitoneOffset).toBe((mayamalavagowla.semitones[0] ?? 0) + 12);
  });

  it('fifth_drone produces a 2-note root+fifth voicing', () => {
    expect(generateChordStampNotes('fifth_drone', mayamalavagowla, 0, 4)).toHaveLength(2);
  });

  it('decreasing velocity by chord-tone index, never below 0.55', () => {
    const notes = generateChordStampNotes('maj7_lydian', mayamalavagowla, 0, 4);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i].velocity).toBeLessThanOrEqual(notes[i - 1].velocity);
      expect(notes[i].velocity).toBeGreaterThanOrEqual(0.55);
    }
  });
});
