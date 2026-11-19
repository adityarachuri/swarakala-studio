import {describe, expect, it} from 'vitest';
import {REFERENCE_SESSIONS} from '../../src/data/presets';
import {getScaleById, getTalaById, isSemitoneInScale} from '../../src/engine/musicTheory';

describe('REFERENCE_SESSIONS data integrity', () => {
  it('has at least one bundled reference session', () => {
    expect(REFERENCE_SESSIONS.length).toBeGreaterThan(0);
  });

  it('every session has a unique id', () => {
    const ids = REFERENCE_SESSIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every session\'s scaleId and talaId resolve to real engine scales/talas', () => {
    for (const session of REFERENCE_SESSIONS) {
      expect(getScaleById(session.scaleId).id).toBe(session.scaleId);
      expect(getTalaById(session.talaId).id).toBe(session.talaId);
    }
  });

  it('every session has at least one track', () => {
    for (const session of REFERENCE_SESSIONS) {
      expect(session.tracks.length).toBeGreaterThan(0);
    }
  });

  it('every note in every track has a step within [0, totalSteps)', () => {
    for (const session of REFERENCE_SESSIONS) {
      for (const track of session.tracks) {
        for (const note of track.notes) {
          expect(note.step).toBeGreaterThanOrEqual(0);
          expect(note.step).toBeLessThan(session.totalSteps);
        }
      }
    }
  });

  it('every note has a unique id within its track', () => {
    for (const session of REFERENCE_SESSIONS) {
      for (const track of session.tracks) {
        const ids = track.notes.map((n) => n.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('melodic (non-percussion) track notes stay within the declared scale', () => {
    for (const session of REFERENCE_SESSIONS) {
      const scale = getScaleById(session.scaleId);
      for (const track of session.tracks) {
        if (track.role === 'percussion') continue;
        for (const note of track.notes) {
          expect(isSemitoneInScale(note.semitoneOffset, scale)).toBe(true);
        }
      }
    }
  });

  it('bpm is within a sane musical range', () => {
    for (const session of REFERENCE_SESSIONS) {
      expect(session.bpm).toBeGreaterThanOrEqual(30);
      expect(session.bpm).toBeLessThanOrEqual(220);
    }
  });

  it('section track arrays, if present, carry forward the same track count as the base session', () => {
    for (const session of REFERENCE_SESSIONS) {
      if (!session.sections) continue;
      for (const section of session.sections) {
        expect(section.tracks.length).toBe(session.tracks.length);
      }
    }
  });
});
