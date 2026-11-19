import {describe, expect, it} from 'vitest';
import {
  getLocalizedChakraName,
  getLocalizedMelakartaName,
  MELAKARTA_72,
  SULADI_JATIS,
  SULADI_TALAS,
} from '../../src/data/musicLiterature';

const sample = MELAKARTA_72[14]; // Mela 15, Mayamalavagowla

describe('getLocalizedChakraName', () => {
  it('returns the Telugu chakra name for te', () => {
    expect(getLocalizedChakraName(sample, 'te')).toBe(sample.chakraNameTe);
  });

  it('returns the Sanskrit chakra name for sa', () => {
    expect(getLocalizedChakraName(sample, 'sa')).toBe(sample.chakraNameSa);
  });

  it('defaults to the English chakra name otherwise', () => {
    expect(getLocalizedChakraName(sample, 'en')).toBe(sample.chakraName);
  });
});

describe('getLocalizedMelakartaName', () => {
  it('returns the Telugu name for te', () => {
    expect(getLocalizedMelakartaName(sample, 'te')).toBe(sample.nameTe);
  });

  it('returns the Sanskrit name for sa', () => {
    expect(getLocalizedMelakartaName(sample, 'sa')).toBe(sample.nameSa);
  });

  it('defaults to the English name otherwise', () => {
    expect(getLocalizedMelakartaName(sample, 'en')).toBe(sample.name);
  });
});

describe('MELAKARTA_72 data integrity', () => {
  it('generates exactly 72 entries numbered 1-72', () => {
    expect(MELAKARTA_72).toHaveLength(72);
    expect(MELAKARTA_72.map((m) => m.number)).toEqual(Array.from({length: 72}, (_, i) => i + 1));
  });

  it('every entry has exactly 7 semitones (sampoorna scale)', () => {
    for (const m of MELAKARTA_72) {
      expect(m.semitones).toHaveLength(7);
    }
  });
});

describe('SULADI_TALAS / SULADI_JATIS data integrity', () => {
  it('has a non-empty list of talas and jatis', () => {
    expect(SULADI_TALAS.length).toBeGreaterThan(0);
    expect(SULADI_JATIS.length).toBeGreaterThan(0);
  });

  it('every tala has a unique id', () => {
    const ids = SULADI_TALAS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
