import {describe, expect, it} from 'vitest';
import {
  buildDiscoveryArchive,
  DIFFICULTY_META,
  HISTORICAL_ERA_META,
  RASA_META,
} from '../../src/data/discoveryArchive';
import {getScaleById, getTalaById} from '../../src/engine/musicTheory';

const VALID_RASAS = new Set(RASA_META.map((r) => r.id));
const VALID_DIFFICULTIES = new Set(DIFFICULTY_META.map((d) => d.id));
const VALID_ERAS = new Set(HISTORICAL_ERA_META.map((e) => e.id));

describe('buildDiscoveryArchive', () => {
  const entries = buildDiscoveryArchive('en');

  it('produces a non-trivial archive (dozens of ragas and talas)', () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it('every entry has a unique uid', () => {
    const uids = entries.map((e) => e.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('every raga entry\'s targetId resolves to a scale (not silently falling back to the default)', () => {
    const ragaEntries = entries.filter((e) => e.kind === 'raga');
    for (const e of ragaEntries) {
      expect(getScaleById(e.targetId).id).toBe(e.targetId);
    }
  });

  it('every tala entry\'s targetId resolves to a tala (not silently falling back to the default)', () => {
    const talaEntries = entries.filter((e) => e.kind === 'tala');
    for (const e of talaEntries) {
      expect(getTalaById(e.targetId).id).toBe(e.targetId);
    }
  });

  it('every entry references only whitelisted rasa ids', () => {
    for (const e of entries) {
      for (const r of e.rasas) {
        expect(VALID_RASAS.has(r)).toBe(true);
      }
    }
  });

  it('every entry references a whitelisted difficulty and historical era', () => {
    for (const e of entries) {
      expect(VALID_DIFFICULTIES.has(e.difficulty)).toBe(true);
      expect(VALID_ERAS.has(e.historicalEra)).toBe(true);
    }
  });

  it('every raga entry has at least one preview semitone (talas preview via beats instead)', () => {
    for (const e of entries.filter((e) => e.kind === 'raga')) {
      expect(e.previewSemitones.length).toBeGreaterThan(0);
    }
  });

  it('every tala entry carries previewBeats instead of preview semitones', () => {
    for (const e of entries.filter((e) => e.kind === 'tala')) {
      expect(e.previewSemitones).toEqual([]);
      expect(e.previewBeats).toBeGreaterThan(0);
    }
  });

  it('produces the same number of entries across all three locales', () => {
    expect(buildDiscoveryArchive('te')).toHaveLength(entries.length);
    expect(buildDiscoveryArchive('sa')).toHaveLength(entries.length);
  });

  it('includes both ragas and talas', () => {
    const kinds = new Set(entries.map((e) => e.kind));
    expect(kinds.has('raga')).toBe(true);
    expect(kinds.has('tala')).toBe(true);
  });
});
