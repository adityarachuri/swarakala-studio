import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
  getDefaultConsoleMidiPreset,
  isWebMidiSupported,
  loadSavedMidiMappings,
  parseMidiMessage,
  saveMidiMappings,
  scaleMidiValue,
  type MidiMappingEntry,
} from '../../src/engine/midiMapping';

const STORAGE_KEY = 'swarakala_midi_mappings_v1';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('scaleMidiValue', () => {
  it('maps raw 0 to min and raw 127 to max', () => {
    expect(scaleMidiValue(0, 0, 1, 0.01)).toBeCloseTo(0, 5);
    expect(scaleMidiValue(127, 0, 1, 0.01)).toBeCloseTo(1, 5);
  });

  it('inverts the mapping when inverted=true', () => {
    expect(scaleMidiValue(0, 0, 1, 0.01, true)).toBeCloseTo(1, 5);
    expect(scaleMidiValue(127, 0, 1, 0.01, true)).toBeCloseTo(0, 5);
  });

  it('snaps to the center detent for a symmetric range at CC 64', () => {
    expect(scaleMidiValue(64, -1, 1, 0.01, false, true)).toBe(0);
    expect(scaleMidiValue(63, -1, 1, 0.01, false, true)).toBe(0);
    expect(scaleMidiValue(65, -1, 1, 0.01, false, true)).toBe(0);
  });

  it('does not apply the center detent when the range is not symmetric', () => {
    expect(scaleMidiValue(64, 0, 1, 0.01, false, true)).not.toBe(0);
  });

  it('clamps rounding to the step grid and keeps the result within [min, max]', () => {
    const value = scaleMidiValue(50, 0, 10, 1);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(10);
  });

  it('clamps out-of-range rawValue input', () => {
    expect(scaleMidiValue(-50, 0, 1, 0.01)).toBeCloseTo(0, 5);
    expect(scaleMidiValue(500, 0, 1, 0.01)).toBeCloseTo(1, 5);
  });
});

describe('parseMidiMessage', () => {
  it('returns null for malformed (too-short) data', () => {
    expect(parseMidiMessage(new Uint8Array([0xb0]), 'dev')).toBeNull();
    expect(parseMidiMessage(null as unknown as Uint8Array, 'dev')).toBeNull();
  });

  it('parses a Control Change message (status 0xB0-0xBF)', () => {
    const msg = parseMidiMessage(new Uint8Array([0xb0, 7, 100]), 'Fader Box');
    expect(msg).toEqual({
      channel: 1,
      kind: 'cc',
      number: 7,
      rawValue: 100,
      deviceName: 'Fader Box',
      timestamp: expect.any(Number),
    });
  });

  it('extracts the channel number from the low nibble of the status byte', () => {
    const msg = parseMidiMessage(new Uint8Array([0xb3, 1, 64]), 'dev');
    expect(msg?.channel).toBe(4); // 0xB3 -> channel index 3 -> 1-based channel 4
  });

  it('parses a Note On message (status 0x90-0x9F) with velocity > 0', () => {
    const msg = parseMidiMessage(new Uint8Array([0x90, 60, 90]), 'Keys');
    expect(msg).toMatchObject({kind: 'note', number: 60, rawValue: 90});
  });

  it('treats a Note On with velocity 0 as a note-off and returns null', () => {
    expect(parseMidiMessage(new Uint8Array([0x90, 60, 0]), 'Keys')).toBeNull();
  });

  it('returns null for message types it does not understand', () => {
    expect(parseMidiMessage(new Uint8Array([0xe0, 0, 0]), 'dev')).toBeNull(); // pitch bend
  });

  it('defaults data2 to 0 when only 2 bytes are present (CC only)', () => {
    const msg = parseMidiMessage(new Uint8Array([0xb0, 10]), 'dev');
    expect(msg?.rawValue).toBe(0);
  });
});

describe('getDefaultConsoleMidiPreset', () => {
  it('returns a non-empty list of valid mapping entries', () => {
    const preset = getDefaultConsoleMidiPreset();
    expect(preset.length).toBeGreaterThan(0);
    for (const entry of preset) {
      expect(entry.channel).toBeGreaterThanOrEqual(1);
      expect(entry.channel).toBeLessThanOrEqual(16);
      expect(entry.number).toBeGreaterThanOrEqual(0);
      expect(entry.number).toBeLessThanOrEqual(127);
    }
  });

  it('has unique entry ids', () => {
    const ids = getDefaultConsoleMidiPreset().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('saveMidiMappings / loadSavedMidiMappings', () => {
  it('round-trips a valid mapping list through localStorage', () => {
    const preset = getDefaultConsoleMidiPreset();
    saveMidiMappings(preset);
    const loaded = loadSavedMidiMappings();
    expect(loaded.map((e) => e.id)).toEqual(preset.map((e) => e.id));
    expect(loaded.map((e) => e.targetId)).toEqual(preset.map((e) => e.targetId));
    // loadSavedMidiMappings normalizes optional flags to explicit booleans.
    for (const entry of loaded) {
      expect(entry.inverted).toBe(false);
      expect(entry.isToggle).toBe(false);
    }
  });

  it('returns an empty array when nothing has been saved', () => {
    expect(loadSavedMidiMappings()).toEqual([]);
  });

  it('returns an empty array for corrupted JSON in storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadSavedMidiMappings()).toEqual([]);
  });

  it('returns an empty array when the stored value is not an array', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({not: 'an array'}));
    expect(loadSavedMidiMappings()).toEqual([]);
  });

  it('filters out entries with an invalid targetId', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {id: 'x', targetId: 'track.0.volume', targetLabel: 'L', channel: 1, kind: 'cc', number: 1},
        {id: 'y', targetId: 'totally.invalid.path', targetLabel: 'L', channel: 1, kind: 'cc', number: 2},
      ])
    );
    const result = loadSavedMidiMappings();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('x');
  });

  it('filters out entries with out-of-range channel or CC number', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {id: 'bad-channel', targetId: 'master.volume', targetLabel: 'L', channel: 99, kind: 'cc', number: 1},
        {id: 'bad-number', targetId: 'master.volume', targetLabel: 'L', channel: 1, kind: 'cc', number: 999},
      ])
    );
    expect(loadSavedMidiMappings()).toEqual([]);
  });

  it('accepts a valid track.N.* targetId for N in 0-5', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {id: 'ok', targetId: 'track.5.muted', targetLabel: 'L', channel: 1, kind: 'cc', number: 1},
      ])
    );
    expect(loadSavedMidiMappings()).toHaveLength(1);
  });

  it('rejects an out-of-range track index (track.6.*)', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {id: 'bad', targetId: 'track.6.volume', targetLabel: 'L', channel: 1, kind: 'cc', number: 1},
      ])
    );
    expect(loadSavedMidiMappings()).toEqual([]);
  });

  it('caps the loaded list at 64 entries', () => {
    const many: MidiMappingEntry[] = Array.from({length: 100}, (_, i) => ({
      id: `m-${i}`,
      targetId: 'master.volume',
      targetLabel: 'L',
      channel: 1,
      kind: 'cc' as const,
      number: 1,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(many));
    expect(loadSavedMidiMappings()).toHaveLength(64);
  });

  it('ignores a storage write failure (e.g. quota exceeded) without throwing', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => saveMidiMappings(getDefaultConsoleMidiPreset())).not.toThrow();
    window.localStorage.setItem = original;
  });
});

describe('isWebMidiSupported', () => {
  it('reflects whether navigator.requestMIDIAccess exists', () => {
    expect(isWebMidiSupported()).toBe(typeof navigator.requestMIDIAccess === 'function');
  });
});
