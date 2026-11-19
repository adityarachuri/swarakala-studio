import {describe, expect, it} from 'vitest';
import {
  getLocalizedGamakaName,
  getLocalizedTraditionSwara,
  STUDIO_LOCALE_META,
  STUDIO_STRINGS,
} from '../../src/i18n/studioLocale';
import type {GamakaType} from '../../src/types/studio';

describe('getLocalizedGamakaName', () => {
  it('returns the English label by default', () => {
    expect(getLocalizedGamakaName('kampita', 'en')).toBe('Kampita');
  });

  it('returns the Telugu label for te', () => {
    expect(getLocalizedGamakaName('kampita', 'te')).toBe('కంపితం');
  });

  it('returns the Sanskrit label for sa', () => {
    expect(getLocalizedGamakaName('kampita', 'sa')).toBe('कम्पितम्');
  });

  it('has a translation for every GamakaType in every locale', () => {
    const gamakas: GamakaType[] = ['none', 'kampita', 'meend', 'nokku', 'andolan', 'sphurita', 'staccato'];
    for (const g of gamakas) {
      for (const locale of ['en', 'te', 'sa'] as const) {
        expect(getLocalizedGamakaName(g, locale)).toBeTruthy();
      }
    }
  });
});

describe('getLocalizedTraditionSwara', () => {
  it('returns S for the tonic regardless of tradition or locale', () => {
    expect(getLocalizedTraditionSwara(0, 'carnatic', 'en').base).toBe('S');
    expect(getLocalizedTraditionSwara(0, 'hindustani', 'en').base).toBe('S');
  });

  it('distinguishes carnatic and hindustani degree-2 labels in English', () => {
    const carnatic = getLocalizedTraditionSwara(1, 'carnatic', 'en').base;
    const hindustani = getLocalizedTraditionSwara(1, 'hindustani', 'en').base;
    expect(carnatic).toBe('R₁');
    expect(hindustani).toBe('r');
  });

  it('wraps semitone offsets greater than 11 via modulo', () => {
    const base = getLocalizedTraditionSwara(0, 'carnatic', 'en').base;
    const octaveUp = getLocalizedTraditionSwara(12, 'carnatic', 'en').base;
    expect(octaveUp).toBe(base);
  });

  it('marks an upper-octave note with the upper octave diacritic', () => {
    expect(getLocalizedTraditionSwara(12, 'carnatic', 'en').octaveMark).toBe('̇');
  });

  it('marks a lower-octave note with the lower octave diacritic', () => {
    expect(getLocalizedTraditionSwara(-12, 'carnatic', 'en').octaveMark).toBe('̣');
  });

  it('has no octave mark within the base octave', () => {
    expect(getLocalizedTraditionSwara(5, 'carnatic', 'en').octaveMark).toBe('');
  });

  it('returns Telugu script for te locale', () => {
    expect(getLocalizedTraditionSwara(0, 'carnatic', 'te').base).toBe('స');
  });

  it('returns Devanagari script for sa locale', () => {
    expect(getLocalizedTraditionSwara(0, 'carnatic', 'sa').base).toBe('स');
  });

  it('distinguishes carnatic and hindustani Telugu labels for a non-tonic degree', () => {
    const carnatic = getLocalizedTraditionSwara(1, 'carnatic', 'te').base;
    const hindustani = getLocalizedTraditionSwara(1, 'hindustani', 'te').base;
    expect(carnatic).not.toBe(hindustani);
  });

  it('distinguishes carnatic and hindustani Sanskrit labels for a non-tonic degree', () => {
    const carnatic = getLocalizedTraditionSwara(1, 'carnatic', 'sa').base;
    const hindustani = getLocalizedTraditionSwara(1, 'hindustani', 'sa').base;
    expect(carnatic).not.toBe(hindustani);
  });
});

describe('STUDIO_STRINGS / STUDIO_LOCALE_META', () => {
  it('defines metadata for all three locales', () => {
    expect(Object.keys(STUDIO_LOCALE_META).sort()).toEqual(['en', 'sa', 'te']);
  });

  it('defines the string table for all three locales', () => {
    expect(Object.keys(STUDIO_STRINGS).sort()).toEqual(['en', 'sa', 'te']);
  });

  it('every locale has the exact same set of string keys as English (no missing translations)', () => {
    const enKeys = Object.keys(STUDIO_STRINGS.en).sort();
    for (const locale of ['te', 'sa'] as const) {
      expect(Object.keys(STUDIO_STRINGS[locale]).sort()).toEqual(enKeys);
    }
  });
});
