import {beforeEach, describe, expect, it} from 'vitest';
import {deleteSession, getAllSessions, saveSession, seedReferenceSessionsIfEmpty} from '../../src/db/sessionStore';
import type {StudioSession} from '../../src/types/studio';

function makeSession(overrides: Partial<StudioSession> = {}): StudioSession {
  return {
    id: overrides.id ?? `s-${Math.random().toString(36).slice(2)}`,
    title: 'Session',
    subtitle: 'Sub',
    tradition: 'western',
    scaleId: 'ionian',
    talaId: 'common_4_4',
    bpm: 100,
    rootMidi: 60,
    a4Hz: 440,
    microtonal: false,
    totalSteps: 16,
    stepsPerBeat: 4,
    tracks: [],
    tanpura: {enabled: false, volume: 0.5, brightness: 0.5, fifthMode: 'Pa', fineTuneCents: 0},
    master: {
      volume: 0.9,
      lowGainDb: 0,
      midGainDb: 0,
      highGainDb: 0,
      reverbMix: 0.2,
      reverbRoom: 'hall',
      delayMix: 0,
      delayFeedback: 0,
      compressorEnabled: false,
      humanizeAmount: 0,
    },
    pedagogy: {
      arohana: '',
      avarohana: '',
      vadi: '',
      samvadi: '',
      pakad: '',
      timeOfDay: '',
      chordProgression: '',
      performanceGuidance: '',
      sahityaOrLyrics: '',
      solkattuOrBol: '',
      sourceAttributionNote: '',
    },
    updatedAt: Date.now(),
    ...overrides,
  };
}

// fake-indexeddb persists across tests within a module; reset by deleting all known sessions.
async function clearAll() {
  const existing = await getAllSessions();
  for (const s of existing) {
    await deleteSession(s.id);
  }
}

beforeEach(async () => {
  await clearAll();
});

describe('sessionStore (IndexedDB-backed)', () => {
  it('returns an empty array when no sessions have been saved', async () => {
    expect(await getAllSessions()).toEqual([]);
  });

  it('saveSession then getAllSessions round-trips the session', async () => {
    const session = makeSession({id: 'a', title: 'My Song'});
    await saveSession(session);
    const all = await getAllSessions();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('a');
    expect(all[0].title).toBe('My Song');
  });

  it('saveSession stamps updatedAt to the current time', async () => {
    const before = Date.now();
    await saveSession(makeSession({id: 'a', updatedAt: 1}));
    const [saved] = await getAllSessions();
    expect(saved.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('saveSession overwrites an existing session with the same id', async () => {
    await saveSession(makeSession({id: 'a', title: 'First'}));
    await saveSession(makeSession({id: 'a', title: 'Second'}));
    const all = await getAllSessions();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Second');
  });

  it('getAllSessions sorts by updatedAt descending (most recent first)', async () => {
    await saveSession(makeSession({id: 'old', updatedAt: 1}));
    await new Promise((r) => setTimeout(r, 5));
    await saveSession(makeSession({id: 'new', updatedAt: 2}));
    const all = await getAllSessions();
    expect(all[0].id).toBe('new');
    expect(all[1].id).toBe('old');
  });

  it('deleteSession removes exactly the matching session', async () => {
    await saveSession(makeSession({id: 'a'}));
    await saveSession(makeSession({id: 'b'}));
    await deleteSession('a');
    const all = await getAllSessions();
    expect(all.map((s) => s.id)).toEqual(['b']);
  });

  it('deleteSession on a non-existent id is a no-op, not an error', async () => {
    await expect(deleteSession('does-not-exist')).resolves.toBeUndefined();
  });

  describe('localStorage fallback (IndexedDB unavailable)', () => {
    it('falls back to localStorage for save/getAll/delete when indexedDB is undefined', async () => {
      const original = globalThis.indexedDB;
      // @ts-expect-error - deliberately simulating an environment without IndexedDB
      delete globalThis.indexedDB;
      try {
        await saveSession(makeSession({id: 'fallback-a'}));
        await saveSession(makeSession({id: 'fallback-b'}));
        const all = await getAllSessions();
        expect(all.map((s) => s.id).sort()).toEqual(['fallback-a', 'fallback-b']);

        await deleteSession('fallback-a');
        const afterDelete = await getAllSessions();
        expect(afterDelete.map((s) => s.id)).toEqual(['fallback-b']);
      } finally {
        globalThis.indexedDB = original;
        window.localStorage.clear();
      }
    });

    it('getAllSessions returns [] when localStorage also has nothing and IndexedDB is unavailable', async () => {
      const original = globalThis.indexedDB;
      // @ts-expect-error - deliberately simulating an environment without IndexedDB
      delete globalThis.indexedDB;
      try {
        expect(await getAllSessions()).toEqual([]);
      } finally {
        globalThis.indexedDB = original;
      }
    });
  });

  describe('seedReferenceSessionsIfEmpty', () => {
    it('seeds the provided templates when the store is empty', async () => {
      const templates = [makeSession({id: 't1'}), makeSession({id: 't2'})];
      const result = await seedReferenceSessionsIfEmpty(templates);
      expect(result.map((s) => s.id).sort()).toEqual(['t1', 't2']);
    });

    it('does not seed when sessions already exist', async () => {
      await saveSession(makeSession({id: 'existing'}));
      const result = await seedReferenceSessionsIfEmpty([makeSession({id: 'template'})]);
      expect(result.map((s) => s.id)).toEqual(['existing']);
    });
  });
});
